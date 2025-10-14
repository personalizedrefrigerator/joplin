import { addColumnAfter, addRowAfter, deleteColumn, deleteRow, tableEditing } from 'prosemirror-tables';
import createFloatingButtonPlugin, { ToolbarType } from './utils/createFloatingButtonPlugin';
import addColumnRightIcon from '../vendor/icons/addColumnRight';
import addRowBelowIcon from '../vendor/icons/addRowBelow';
import removeRowIcon from '../vendor/icons/removeRow';
import removeColumnIcon from '../vendor/icons/removeColumn';

const tablePlugin = [
	tableEditing({ allowTableNodeSelection: true }),
	createFloatingButtonPlugin('table', [
		{
			icon: addRowBelowIcon,
			label: (_) => _('Add row'),
			command: () => addRowAfter,
		},
		{
			icon: addColumnRightIcon,
			label: (_) => _('Add column'),
			command: () => addColumnAfter,
		},
		{
			icon: removeRowIcon,
			label: (_) => _('Delete row'),
			command: () => deleteRow,
		},
		{
			icon: removeColumnIcon,
			label: (_) => _('Delete column'),
			command: () => deleteColumn,
		},
	], ToolbarType.FloatAboveBelow),
];

export default tablePlugin;
