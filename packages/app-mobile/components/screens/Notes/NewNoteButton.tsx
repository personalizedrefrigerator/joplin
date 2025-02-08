import * as React from 'react';
import { _ } from '@joplin/lib/locale';
import CommandService from '@joplin/lib/services/CommandService';
import { Divider } from 'react-native-paper';
import FloatingActionButton from '../../buttons/FloatingActionButton';
import { StyleSheet, View } from 'react-native';
import { AttachFileAction } from '../Note/commands/attachFile';
import LabelledIconButton from '../../buttons/LabelledIconButton';
import TextButton, { ButtonSize, ButtonType } from '../../buttons/TextButton';

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
	const menuContent = <View style={styles.menuContent}>
		<View style={styles.buttonRow}>
			<LabelledIconButton
				onPress={() => makeNewNote(false, AttachFileAction.AttachPhoto)}
				style={styles.shortcutButton}
				title={_('Camera')}
				icon='material camera'
			/>
			<LabelledIconButton
				onPress={() => makeNewNote(false, AttachFileAction.AttachFile)}
				style={styles.shortcutButton}
				title={_('Attachment')}
				icon='material attachment'
			/>
			<LabelledIconButton
				onPress={() => makeNewNote(false, AttachFileAction.AttachDrawing)}
				style={styles.shortcutButton}
				title={_('Drawing')}
				icon='material draw'
			/>
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

	return <FloatingActionButton
		mainButton={{
			icon: 'add',
			label: _('Add new'),
		}}
		menuContent={menuContent}
	/>;
};

export default NewNoteButton;
