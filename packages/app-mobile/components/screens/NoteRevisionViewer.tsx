import * as React from 'react';
import { connect } from 'react-redux';
import { View, StyleSheet } from 'react-native';
import { AppState } from '../../utils/types';
import useAsyncEffect from '@joplin/lib/hooks/useAsyncEffect';
import Revision from '@joplin/lib/models/Revision';
import BaseModel, { ModelType } from '@joplin/lib/BaseModel';
import { IconButton, Text } from 'react-native-paper';
import Dropdown from '../Dropdown';
import ScreenHeader, { MenuOptionType } from '../ScreenHeader';
import { formatMsToLocal } from '@joplin/utils/time';
import { useCallback, useContext, useMemo, useState } from 'react';
import { PrimaryButton } from '../buttons';
import { _ } from '@joplin/lib/locale';
import { NoteEntity, RevisionEntity } from '@joplin/lib/services/database/types';
import RevisionService from '@joplin/lib/services/RevisionService';
import NoteBodyViewer from '../NoteBodyViewer/NoteBodyViewer';
import { MarkupLanguage } from '@joplin/renderer';
import attachedResources, { AttachedResources } from '@joplin/lib/utils/attachedResources';
import shim, { MessageBoxType } from '@joplin/lib/shim';
import { themeStyle } from '../global-style';
import getHelpMessage from '@joplin/lib/components/shared/NoteRevisionViewer/getHelpMessage';
import { DialogContext } from '../DialogManager';
import useDeleteHistoryClick from '@joplin/lib/components/shared/NoteRevisionViewer/useDeleteHistoryClick';

interface Props {
	themeId: number;
	selectedNoteId: string;

	// Properties passed by the navigation logic
	navigation?: {
		state?: {
			noteId: string;
		};
	};
}

const useRevisions = (noteId: string) => {
	const [revisions, setRevisions] = useState<RevisionEntity[]>([]);

	useAsyncEffect(async (event) => {
		if (!noteId) {
			setRevisions([]);
			return;
		}

		const revisions = await Revision.allByType(ModelType.Note, noteId);
		if (event.cancelled) return;
		setRevisions(revisions);
	}, [noteId]);

	return revisions;
};

const useRevisionNote = (revisions: RevisionEntity[], revisionId: string) => {
	const [note, setNote] = useState<NoteEntity|null>(null);
	const [resources, setResources] = useState<AttachedResources>({});

	useAsyncEffect(async event => {
		const revisionIndex = BaseModel.modelIndexById(revisions, revisionId);
		if (revisionIndex === -1) {
			setNote(null);
			return;
		}
		const note = await RevisionService.instance().revisionNote(revisions, revisionIndex);
		if (event.cancelled) return;
		setNote(note);

		const resources = await attachedResources(note?.body ?? '');
		if (event.cancelled) return;
		setResources(resources);
	}, [revisions, revisionId]);

	return { note, resources };
};

const useStyles = (themeId: number) => {
	return useMemo(() => {
		const theme = themeStyle(themeId);
		return StyleSheet.create({
			noteViewer: {
				flex: 1,
			},
			controls: {
				padding: theme.margin,
				flexDirection: 'row',
				flexWrap: 'wrap',
				alignItems: 'center',
				gap: 3,
			},
			dropdownListStyle: {
				backgroundColor: theme.backgroundColor,
			},
			dropdownItemStyle: {
				color: theme.color,
				fontSize: theme.fontSize,
			},
			dropdownHeaderStyle: {
				color: theme.color,
				fontSize: theme.fontSize,
			},
			root: {
				...theme.rootStyle,
			},
		});
	}, [themeId]);
};

const emptyStringList: string[] = [];

const NoteRevisionViewer: React.FC<Props> = props => {
	const noteId = props.navigation?.state?.noteId ?? props.selectedNoteId;
	const revisions = useRevisions(noteId);
	const [currentRevisionId, setCurrentRevisionId] = useState<string>('');
	const { note, resources } = useRevisionNote(revisions, currentRevisionId);
	const [initialScroll, setInitialScroll] = useState(0);
	const [hasRevisions, setHasRevisions] = useState(false);

	const options = useMemo(() => {
		const result = [];
		for (const revision of revisions) {
			const stats = Revision.revisionPatchStatsText(revision);
			result.push({
				label: `${formatMsToLocal(revision.item_updated_time)} (${stats})`,
				value: revision.id,
			});
		}
		setHasRevisions(result.length > 0);
		return result;
	}, [revisions]);

	const onOptionSelected = useCallback((value: string) => {
		setCurrentRevisionId(value);
	}, []);

	const [restoring, setRestoring] = useState(false);
	const onRestore = useCallback(async () => {
		if (!note) return;
		setRestoring(true);
		try {
			await RevisionService.instance().importRevisionNote(note);
			await shim.showMessageBox(RevisionService.instance().restoreSuccessMessage(note), { type: MessageBoxType.Info });
		} finally {
			setRestoring(false);
		}
	}, [note]);

	const resetScreenState = useCallback(() => {
		setCurrentRevisionId(null);
		setHasRevisions(false);
		revisions.length = 0;
		options.length = 0;
	}, [revisions, options]);

	const [deleting, setDeleting] = useState(false);
	const deleteHistory_onPress = useDeleteHistoryClick({
		noteId,
		setDeleting,
		resetScreenState,
	});

	const disableDeleteHistory = deleting || !hasRevisions;
	const menuOptions = useMemo(() => {
		const output: MenuOptionType[] = [{
			title: _('Delete history'),
			onPress: deleteHistory_onPress,
			disabled: disableDeleteHistory,
		}];

		return output;
	}, [deleteHistory_onPress, disableDeleteHistory]);

	const restoreButtonTitle = _('Restore');
	const helpMessageText = getHelpMessage(restoreButtonTitle);
	const dialogs = useContext(DialogContext);
	const onHelpPress = useCallback(() => {
		void dialogs.info(helpMessageText);
	}, [helpMessageText, dialogs]);

	const styles = useStyles(props.themeId);
	const dropdownLabelText = _('Revision:');

	const restoreButton = (
		<PrimaryButton
			onPress={onRestore}
			disabled={restoring || !note}
		>{restoreButtonTitle}</PrimaryButton>
	);

	return <View style={styles.root}>
		<ScreenHeader menuOptions={menuOptions} title={_('Note history')} />
		<View style={styles.controls}>
			<Text variant='labelLarge'>{dropdownLabelText}</Text>
			<Dropdown
				items={options}
				onValueChange={onOptionSelected}
				selectedValue={currentRevisionId}
				itemListStyle={styles.dropdownListStyle}
				headerStyle={styles.dropdownHeaderStyle}
				itemStyle={styles.dropdownItemStyle}
				accessibilityHint={dropdownLabelText}
				defaultHeaderLabel={_('Select a revision...')}
				// Hides the restore button when the dropdown is open. This
				// is important on small screens where otherwise it's difficult
				// to read the content of the revision dropdown.
				coverableChildrenRight={restoreButton}
			/>
			<IconButton
				icon='help-circle-outline'
				accessibilityLabel={_('Help')}
				onPress={onHelpPress}
			/>
		</View>
		<NoteBodyViewer
			style={styles.noteViewer}
			noteBody={note?.body ?? _('No revision selected')}
			noteMarkupLanguage={MarkupLanguage.Markdown}
			noteResources={resources}
			highlightedKeywords={emptyStringList}
			paddingBottom={0}
			initialScroll={initialScroll}
			onScroll={setInitialScroll}
			noteHash={''}
		/>
	</View>;
};

export default connect((state: AppState) => ({
	themeId: state.settings.theme,
	selectedNoteId: state.selectedNoteIds[0] ?? '',
}))(NoteRevisionViewer);
