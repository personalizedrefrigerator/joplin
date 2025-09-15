import { addColumnAfter, addRowAfter, deleteColumn, deleteRow, deleteTable, tableEditing } from 'prosemirror-tables';
import createFloatingButtonPlugin from './utils/createFloatingButtonPlugin';

const tablePlugin = [
	tableEditing({ allowTableNodeSelection: true }),
	createFloatingButtonPlugin('table', [
		{ label: (_) => _('Add row'), command: addRowAfter },
		{ label: (_) => _('Add column'), command: addColumnAfter },
		{ label: (_) => _('Delete row'), command: deleteRow },
		{ label: (_) => _('Delete column'), command: deleteColumn },
		{ label: (_) => _('Delete table'), command: deleteTable },
	]),
];

export default tablePlugin;
