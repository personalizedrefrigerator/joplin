import { addColumnAfter, addRowAfter, deleteColumn, deleteRow, tableEditing } from 'prosemirror-tables';
import createFloatingButtonPlugin, { ToolbarPosition } from './utils/createFloatingButtonPlugin';
import addColumnRight from '../vendor/icons/addColumnRight';
import addRowBelow from '../vendor/icons/addRowBelow';
import removeRow from '../vendor/icons/removeRow';
import removeColumn from '../vendor/icons/removeColumn';

const tablePlugin = [
	tableEditing({ allowTableNodeSelection: true }),
	createFloatingButtonPlugin('table', [
		{ icon: addRowBelow, label: (_) => _('Add row'), command: () => addRowAfter },
		{ icon: addColumnRight, label: (_) => _('Add column'), command: () => addColumnAfter },
		{ icon: removeRow, label: (_) => _('Delete row'), command: () => deleteRow },
		{ icon: removeColumn, label: (_) => _('Delete column'), command: () => deleteColumn },
	], ToolbarPosition.TopLeftOutside),
];

export default tablePlugin;
