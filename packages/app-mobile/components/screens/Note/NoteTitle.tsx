import * as React from 'react';
import { RefObject } from 'react';
import { Platform, TextInput, View } from 'react-native';
import { IconButton } from 'react-native-paper';
import { _ } from '@joplin/lib/locale';
import { NoteEntity } from '@joplin/lib/services/database/types';
import Checkbox from '../../Checkbox';
import { themeStyle } from '../../global-style';
import TextWrapCalculator from '../Notes/TextWrapCalculator';
import getStyles from './styles';

interface Props {
	styles: ReturnType<typeof getStyles>;
	theme: ReturnType<typeof themeStyle>;
	note: NoteEntity;
	isTodo: boolean;
	readOnly: boolean;
	multiline: boolean;
	showMultilineToggle: boolean | null;
	titleContainerWidth: number;
	titleInputRef: RefObject<TextInput>;
	onContainerWidthChange: (width: number)=> void;
	onToggleMultiline: ()=> void;
	onUpdateWrapState: (showToggle: boolean, multiline: boolean)=> void;
	onChangeTitle: (text: string)=> void;
	onTodoCheckboxChange: (checked: boolean)=> void;
}

const NoteTitle: React.FC<Props> = props => {
	const { styles, theme, note, isTodo, multiline, showMultilineToggle } = props;

	const titleContainerStyle = isTodo ? styles.titleContainerTodo : styles.titleContainer;

	const titleToggleButton = !showMultilineToggle ? null :
		<IconButton
			icon={(!multiline && 'menu-down') || (multiline && 'menu-up')}
			accessibilityLabel={(!multiline && _('Expand title')) || (multiline && _('Collapse title'))}
			onPress={props.onToggleMultiline}
			size={30}
			style={{ width: 30, height: 30, alignSelf: 'center' }}
		/>;

	return (
		<View
			style={titleContainerStyle}
			onLayout={(e) => {
				const width = e.nativeEvent.layout.width;
				if (width !== props.titleContainerWidth) {
					props.onContainerWidthChange(width);
				}
			}}

			// Making this focusable works around a tab ordering bug on Android
			// See https://github.com/laurent22/joplin/issues/14548
			accessible={Platform.OS === 'android'}
			// Since the group is focusable, it also needs a label (otherwise TalkBack reads "unlabelled"):
			aria-label={_('Title')}
		>
			<TextWrapCalculator
				textCompStyle={styles.titleTextInput}
				textCompContainerWidth={props.titleContainerWidth}
				showMultilineToggle={showMultilineToggle}
				multiline={multiline}
				text={note.title}
				updateState={props.onUpdateWrapState}
				readOnly={false}
			/>
			{isTodo && <Checkbox style={styles.checkbox} checked={!!Number(note.todo_completed)} onChange={props.onTodoCheckboxChange} />}
			<TextInput
				key={multiline ? 'multiLine' : 'singleLine'}
				ref={props.titleInputRef}
				underlineColorAndroid="#ffffff00"
				autoCapitalize="sentences"
				style={styles.titleTextInput}
				value={note.title}
				onChangeText={props.onChangeTitle}
				selectionColor={theme.textSelectionColor}
				keyboardAppearance={theme.keyboardAppearance}
				placeholder={_('Add title')}
				placeholderTextColor={theme.colorFaded}
				editable={!props.readOnly}
				multiline={multiline}
				submitBehavior = "blurAndSubmit"
			/>
			{ titleToggleButton }
		</View>
	);
};

export default NoteTitle;
