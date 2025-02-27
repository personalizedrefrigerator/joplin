import * as React from 'react';
import { _ } from '@joplin/lib/locale';
import CommandService from '@joplin/lib/services/CommandService';
import { Divider } from 'react-native-paper';
import FloatingActionButton from '../../buttons/FloatingActionButton';
import { AccessibilityActionEvent, AccessibilityActionInfo, StyleSheet, View } from 'react-native';
import { AttachFileAction } from '../Note/commands/attachFile';
import LabelledIconButton from '../../buttons/LabelledIconButton';
import TextButton, { ButtonSize, ButtonType } from '../../buttons/TextButton';
import { useCallback, useMemo, useRef } from 'react';

interface Props {

}

const makeNewNote = (isTodo: boolean, action?: AttachFileAction) => {
	const body = '';
	void CommandService.instance().execute('newNote', body, isTodo, { attachFileAction: action });
};

const styles = StyleSheet.create({
	buttonRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 2,
	},
	mainButtonRow: {
		flexWrap: 'nowrap',
	},
	spacer: {
		flexShrink: 1,
		flexGrow: 0,
		width: 12,
	},
	shortcutButton: {
		flexGrow: 1,
	},
	mainButton: {
		flexShrink: 1,
	},
	mainButtonLabel: {
		fontSize: 16,
		fontWeight: 'bold',
	},
	menuContent: {
		gap: 12,
		flexShrink: 1,
	},
});

const NewNoteButton: React.FC<Props> = _props => {
	const newNoteRef = useRef<View|null>(null);

	const renderShortcutButton = (action: AttachFileAction, icon: string, title: string) => {
		return <LabelledIconButton
			onPress={() => makeNewNote(false, action)}
			style={styles.shortcutButton}
			title={title}
			accessibilityHint={_('New note from %s', title)}
			icon={icon}
		/>;
	};

	const menuContent = <View style={styles.menuContent}>
		<View style={styles.buttonRow}>
			{renderShortcutButton(AttachFileAction.AttachFile, 'material attachment', _('Attachment'))}
			{renderShortcutButton(AttachFileAction.AttachPhoto, 'material camera', _('Camera'))}
			{renderShortcutButton(AttachFileAction.AttachPhoto, 'material draw', _('Drawing'))}
		</View>
		<Divider/>
		<View style={[styles.buttonRow, styles.mainButtonRow]}>
			<TextButton
				icon='checkbox-outline'
				style={styles.mainButton}
				onPress={() => {
					makeNewNote(true);
				}}
				type={ButtonType.Secondary}
				size={ButtonSize.Larger}
			>{_('New to-do')}</TextButton>
			<View style={styles.spacer}/>
			<TextButton
				touchableRef={newNoteRef}
				icon='file-document-outline'
				style={styles.mainButton}
				onPress={() => {
					makeNewNote(false);
				}}
				type={ButtonType.Primary}
				size={ButtonSize.Larger}
			>{_('New note')}</TextButton>
		</View>
	</View>;

	// Accessibility actions simplify creating new notes and to-dos on Android and iOS:
	const accessibilityActions = useMemo((): AccessibilityActionInfo[] => {
		return [{
			name: 'new-note',
			label: _('New note'),
		}, {
			name: 'new-to-do',
			label: _('New to-do'),
		}];
	}, []);
	const onAccessibilityAction = useCallback((event: AccessibilityActionEvent) => {
		if (event.nativeEvent.actionName === 'new-note') {
			makeNewNote(false);
		} else if (event.nativeEvent.actionName === 'new-to-do') {
			makeNewNote(true);
		}
	}, []);

	return <FloatingActionButton
		mainButton={{
			icon: 'add',
			label: _('Add new'),
		}}
		menuLabel={_('New note menu')}
		menuContent={menuContent}
		accessibilityActions={accessibilityActions}
		onAccessibilityAction={onAccessibilityAction}
	/>;
};

export default NewNoteButton;
