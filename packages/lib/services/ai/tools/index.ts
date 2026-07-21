import Setting from '../../../models/Setting';

import searchNotes from './searchNotes';
import semanticSearchNotes from './semanticSearchNotes';
import readNote from './readNote';
import listNotebooks from './listNotebooks';
import listTags from './listTags';
import createNote from './createNote';
import updateNote from './updateNote';
import deleteNote from './deleteNote';
import manageTags from './manageTags';
import createNotebook from './createNotebook';

// Every tool registered here gets an `ai.tool.<id>.enabled` setting (see
// builtInMetadata.ts). Adding a tool to this list without also adding the
// setting means it will be reported as enabled by default — keep them in sync.
const allMcpTools = [
	searchNotes,
	semanticSearchNotes,
	readNote,
	listNotebooks,
	listTags,
	createNote,
	updateNote,
	deleteNote,
	manageTags,
	createNotebook,
];

export const allTools = () => allMcpTools;

export const enabledTools = () => {
	return allMcpTools.filter(t => Setting.value(`ai.tool.${t.id}.enabled`) as boolean);
};

export const findTool = (id: string) => {
	const t = allMcpTools.find(t => t.id === id);
	if (!t) return null;
	if (!(Setting.value(`ai.tool.${t.id}.enabled`) as boolean)) return null;
	return t;
};
