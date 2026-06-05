import * as React from 'react';
import { AppState as RNAppState, View } from 'react-native';
import { stateUtils } from '@joplin/lib/reducer';
import { connect } from 'react-redux';
import NoteList from '../../NoteList';
import Folder from '@joplin/lib/models/Folder';
import Tag from '@joplin/lib/models/Tag';
import Note, { PreviewsOrder } from '@joplin/lib/models/Note';
import Setting from '@joplin/lib/models/Setting';
import { themeStyle } from '../../global-style';
import { FolderPickerOptions, ScreenHeader } from '../../ScreenHeader';
import { _ } from '@joplin/lib/locale';
import { AppState } from '../../../utils/types';
import { FolderEntity, NoteEntity, TagEntity } from '@joplin/lib/services/database/types';
import { getTrashFolderId, itemIsInTrash } from '@joplin/lib/services/trash';
import AccessibleView from '../../accessibility/AccessibleView';
import { Dispatch } from 'redux';
import { DialogContext } from '../../DialogManager';
import { useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { MenuChoice } from '../../DialogManager/types';
import NewNoteButton from './NewNoteButton';
import PerFolderSortOrderService from '@joplin/lib/services/sortOrder/PerFolderSortOrderService';
import { ALL_NOTES_FILTER_ID } from '@joplin/lib/reserved-ids';

interface Props {
	dispatch: Dispatch;

	themeId: number;
	visible: boolean;

	folders: FolderEntity[];
	tags: TagEntity[];
	notesSource: string;
	notesOrder: PreviewsOrder[];
	uncompletedTodosOnTop: boolean;
	showCompletedTodos: boolean;
	noteSelectionEnabled: boolean;

	selectedNoteIds: string[];
	activeFolderId: string;
	selectedFolderId: string;
	selectedTagId: string;
	selectedSmartFilterId: string;
	notesParentType: string;
}

const parentItem = (props: Props) => {
	let output = null;
	if (props.notesParentType === 'Folder') {
		output = Folder.byId(props.folders, props.selectedFolderId);
	} else if (props.notesParentType === 'Tag') {
		output = Tag.byId(props.tags, props.selectedTagId);
	} else if (props.notesParentType === 'SmartFilter') {
		output = { id: props.selectedSmartFilterId, title: _('All notes') };
	} else {
		return null;
	}
	return output;
};

// Show "use own sort order" toggle for folders and the All Notes smart filter,
// but not for tags, conflicts folder, or trash folder.
const shouldShowPerFolderSortToggle = (props: Props): boolean => {
	const { notesParentType, selectedFolderId, selectedSmartFilterId } = props;

	if (notesParentType === 'Folder') {
		return selectedFolderId !== Folder.conflictFolderId() && selectedFolderId !== getTrashFolderId();
	}

	if (notesParentType === 'SmartFilter') {
		return selectedSmartFilterId === ALL_NOTES_FILTER_ID;
	}

	return false;
};

const getCurrentFolderIdForSort = (props: Props): string => {
	if (props.notesParentType === 'Folder') {
		return props.selectedFolderId;
	} else if (props.notesParentType === 'SmartFilter') {
		return props.selectedSmartFilterId;
	}
	return '';
};

const NotesScreenComponent: React.FC<Props> = props => {
	const {
		themeId, visible, folders, noteSelectionEnabled,
		activeFolderId, selectedFolderId, selectedTagId, selectedSmartFilterId,
		notesParentType, notesOrder, uncompletedTodosOnTop, showCompletedTodos,
	} = props;

	const dialogManager = useContext(DialogContext);

	// Lets the stable callbacks below read the latest props without becoming
	// dependencies of the refresh effect/subscription (mirrors the class component
	// reading this.props).
	const propsRef = useRef(props);
	propsRef.current = props;

	const refreshNotes = useCallback(async (notesSourceOverride?: string) => {
		const current = propsRef.current;

		const options = {
			order: current.notesOrder,
			uncompletedTodosOnTop: current.uncompletedTodosOnTop,
			showCompletedTodos: current.showCompletedTodos,
			caseInsensitive: true,
		};

		const parent = parentItem(current);
		if (!parent) return;

		const source = JSON.stringify({
			options: options,
			parentId: parent.id,
		});

		const effectiveNotesSource = notesSourceOverride ?? current.notesSource;
		if (source === effectiveNotesSource) return;
		// For now, search refresh is handled by the search screen.
		if (current.notesParentType === 'Search') return;

		let notes: NoteEntity[] = [];
		if (current.notesParentType === 'Folder') {
			notes = await Note.previews(current.selectedFolderId, options);
		} else if (current.notesParentType === 'Tag') {
			notes = await Tag.notes(current.selectedTagId, options);
		} else if (current.notesParentType === 'SmartFilter') {
			notes = await Note.previews(null, options);
		}

		current.dispatch({
			type: 'NOTE_UPDATE_ALL',
			notes: notes,
			notesSource: source,
		});
	}, []);

	// Refresh on mount and whenever an input that affects the note list changes.
	useEffect(() => {
		void refreshNotes();
	}, [refreshNotes, notesOrder, selectedFolderId, selectedTagId, selectedSmartFilterId, notesParentType, uncompletedTodosOnTop, showCompletedTodos]);

	// Force an update to the notes list when the app state changes.
	useEffect(() => {
		const onAppStateChange = () => { void refreshNotes(''); };
		const subscription = RNAppState.addEventListener('change', onAppStateChange);
		return () => subscription.remove();
	}, [refreshNotes]);

	const sortButton_press = useCallback(async () => {
		const current = propsRef.current;

		type IdType = { name: string; value: string|boolean };
		const buttons: MenuChoice<IdType>[] = [];
		const sortNoteOptions = Setting.enumOptions('notes.sortOrder.field');

		for (const field in sortNoteOptions) {
			if (!sortNoteOptions.hasOwnProperty(field)) continue;
			buttons.push({
				text: sortNoteOptions[field],
				iconChecked: 'fas fa-circle',
				checked: Setting.value('notes.sortOrder.field') === field,
				id: { name: 'notes.sortOrder.field', value: field },
			});
		}

		buttons.push({
			text: `[ ${Setting.settingMetadata('notes.sortOrder.reverse').label()} ]`,
			checked: Setting.value('notes.sortOrder.reverse'),
			id: { name: 'notes.sortOrder.reverse', value: !Setting.value('notes.sortOrder.reverse') },
		});

		buttons.push({
			text: `[ ${Setting.settingMetadata('uncompletedTodosOnTop').label()} ]`,
			checked: Setting.value('uncompletedTodosOnTop'),
			id: { name: 'uncompletedTodosOnTop', value: !Setting.value('uncompletedTodosOnTop') },
		});

		buttons.push({
			text: `[ ${Setting.settingMetadata('showCompletedTodos').label()} ]`,
			checked: Setting.value('showCompletedTodos'),
			id: { name: 'showCompletedTodos', value: !Setting.value('showCompletedTodos') },
		});

		const showPerFolderToggle = shouldShowPerFolderSortToggle(current);
		const currentFolderId = getCurrentFolderIdForSort(current);

		if (showPerFolderToggle) {
			const isSet = PerFolderSortOrderService.isSet(currentFolderId);
			buttons.push({
				text: `[ ${_('Use own sort order')} ]`,
				checked: isSet,
				id: { name: 'perFolderSortOrder', value: !isSet },
			});
		}

		const r = await dialogManager.showMenu(Setting.settingMetadata('notes.sortOrder.field').label(), buttons);
		if (!r) return;

		if (r.name === 'perFolderSortOrder') {
			PerFolderSortOrderService.set(currentFolderId, r.value as boolean);
		} else if (r.name === 'notes.sortOrder.field' || r.name === 'notes.sortOrder.reverse') {
			Setting.setValue(r.name, r.value);
			// Update the appropriate sort order storage based on whether per-folder sort is enabled
			PerFolderSortOrderService.onSortOrderChange(currentFolderId);
		} else {
			Setting.setValue(r.name, r.value);
		}
	}, [dialogManager]);

	const folderPickerOptions = useMemo<FolderPickerOptions>(() => ({
		visible: noteSelectionEnabled,
		mustSelect: true,
	}), [noteSelectionEnabled]);

	const parent = parentItem(props);
	const theme = themeStyle(themeId);

	const rootStyle = visible ? theme.rootStyle : theme.hiddenRootStyle;

	const title = parent ? parent.title : null;
	if (!parent) {
		return (
			<View style={rootStyle}>
				<ScreenHeader title={title} showSideMenuButton={true} showBackButton={false} />
			</View>
		);
	}

	const icon = Folder.unserializeIcon(parent.icon);
	const iconString = icon ? `${icon.emoji} ` : '';

	let buttonFolderId = selectedFolderId !== Folder.conflictFolderId() ? selectedFolderId : null;
	if (!buttonFolderId) buttonFolderId = activeFolderId;

	const addFolderNoteButtons = !!buttonFolderId;

	const makeActionButtonComp = () => {
		if ((notesParentType === 'Folder' && itemIsInTrash(parent)) || !Folder.atLeastOneRealFolderExists(folders)) return null;

		if (addFolderNoteButtons && folders.length > 0) {
			return <NewNoteButton />;
		}
		return null;
	};

	const actionButtonComp = noteSelectionEnabled || !visible ? null : makeActionButtonComp();

	// Ensure that screen readers can't focus the notes list when it isn't visible.
	const accessibilityHidden = !visible;

	return (
		<AccessibleView
			style={rootStyle}

			inert={accessibilityHidden}
		>
			<ScreenHeader
				title={iconString + title}
				showBackButton={false}
				sortButton_press={sortButton_press}
				folderPickerOptions={folderPickerOptions}
				showSearchButton={true}
				showSideMenuButton={true}
			/>
			<NoteList />
			{actionButtonComp}
		</AccessibleView>
	);
};

const NotesScreen = connect((state: AppState) => {
	return {
		folders: state.folders,
		tags: state.tags,
		activeFolderId: state.settings.activeFolderId,
		selectedFolderId: state.selectedFolderId,
		selectedNoteIds: state.selectedNoteIds,
		selectedTagId: state.selectedTagId,
		selectedSmartFilterId: state.selectedSmartFilterId,
		notesParentType: state.notesParentType,
		notes: state.notes,
		notesSource: state.notesSource,
		uncompletedTodosOnTop: state.settings.uncompletedTodosOnTop,
		showCompletedTodos: state.settings.showCompletedTodos,
		themeId: state.settings.theme,
		noteSelectionEnabled: state.noteSelectionEnabled,
		notesOrder: stateUtils.notesOrder(state.settings),
	};
})(NotesScreenComponent);

export default NotesScreen;
