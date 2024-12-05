import { EditorCommandType } from '@joplin/editor/types';
import { _ } from '@joplin/lib/locale';
import { CommandDeclaration } from '@joplin/lib/services/CommandService';

export const enabledCondition = (_commandName: string) => {
	const output = [
		'!noteIsReadOnly',
	];

	return output.filter(c => !!c).join(' && ');
};

const headerDeclarations = () => {
	const result: CommandDeclaration[] = [];
	for (let level = 1; level <= 5; level++) {
		result.push({
			name: `textHeading${level}`,
			iconName: `text H${level}`,
			label: () => _('Header %d', level),
		});
	}

	return result;
};

const declarations: CommandDeclaration[] = [
	{
		name: 'insertText',
	},
	{
		name: 'editor.undo',
	},
	{
		name: 'editor.redo',
	},
	{
		name: 'selectedText',
	},
	{
		name: 'replaceSelection',
	},
	{
		name: 'editor.setText',
	},
	{
		name: 'editor.focus',
	},
	{
		name: 'editor.execCommand',
	},

	{
		name: EditorCommandType.ToggleBolded,
		label: () => _('Bold'),
		iconName: 'fa bold',
	},
	{
		name: EditorCommandType.ToggleItalicized,
		label: () => _('Italic'),
		iconName: 'fa italic',
	},
	...headerDeclarations(),
	{
		name: EditorCommandType.ToggleCode,
		label: () => _('Code'),
		iconName: 'text {;}',
	},
	{
		name: EditorCommandType.ToggleMath,
		label: () => _('Math'),
		iconName: 'text ∑',
	},
	{
		name: EditorCommandType.ToggleNumberedList,
		label: () => _('Ordered list'),
		iconName: 'fa list-ol',
	},
	{
		name: EditorCommandType.ToggleBulletedList,
		label: () => _('Unordered list'),
		iconName: 'fa list-ul',
	},
	{
		name: EditorCommandType.ToggleCheckList,
		label: () => _('Task list'),
		iconName: 'fa tasks',
	},
	{
		name: EditorCommandType.IndentLess,
		label: () => _('Decrease indent level'),
		iconName: 'ant indent-left',
	},
	{
		name: EditorCommandType.IndentMore,
		label: () => _('Increase indent level'),
		iconName: 'ant indent-right',
	},
	{
		name: EditorCommandType.ToggleSearch,
		label: () => _('Search'),
		iconName: 'fa search',
	},
	{
		name: EditorCommandType.EditLink,
		label: () => _('Link'),
		iconName: 'fa link',
	},
];

export default declarations;
