import * as React from 'react';
import { _ } from '@joplin/lib/locale';
import CommandService from '@joplin/lib/services/CommandService';
import { Divider, FAB } from 'react-native-paper';
import FloatingActionButton from '../../buttons/FloatingActionButton';
import { StyleSheet, View } from 'react-native';
import { AttachFileAction } from '../Note/commands/attachFile';
import LabelledIconButton from '../../buttons/LabelledIconButton';

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
		justifyContent: 'space-between',
		gap: 4,
	},
	menuContent: {
		gap: 12,
		flexShrink: 1,
	},
});

const NewNoteButton: React.FC<Props> = _props => {
	const buttons = [];
	buttons.push({
		label: _('New to-do'),
		onPress: () => {
			makeNewNote(true);
		},
		color: '#9b59b6',
		icon: 'checkbox-outline',
	});

	buttons.push({
		label: _('New note'),
		onPress: () => {
			makeNewNote(false);
		},
		color: '#9b59b6',
		icon: 'file-document-outline',
	});


	const actionButtons = buttons.map((action, idx) => {
		return <FAB
			key={`option-${idx}`}
			label={action.label}
			icon={action.icon}
			onPress={action.onPress}
			size='small'
		/>;
	});

	const menuContent = <View style={styles.menuContent}>
		<View style={styles.buttonRow}>
			<LabelledIconButton
				onPress={() => makeNewNote(false, AttachFileAction.AttachPhoto)}
				title={_('Camera')}
				icon='material camera'
			/>
			<LabelledIconButton
				onPress={() => makeNewNote(false, AttachFileAction.AttachFile)}
				title={_('Attachment')}
				icon='material attachment'
			/>
			<LabelledIconButton
				onPress={() => makeNewNote(false, AttachFileAction.AttachDrawing)}
				title={_('Drawing')}
				icon='material draw'
			/>
		</View>
		<Divider/>
		<View style={styles.buttonRow}>
			{actionButtons}
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
