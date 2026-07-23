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
import buildTool from './utils/buildTool';
import { ToolDefinition, ToolError } from '../types';
import { _ } from '../../../locale';
import { substrWithEllipsis } from '../../../string-utils';

// Every tool registered here gets an `ai.tool.<id>.enabled` setting (see
// builtInMetadata.ts). Tools missing settings will throw at runtime.
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

const toolSettingKey = (toolId: string) => `ai.tool.${toolId}.enabled`;
const isToolEnabled = (tool: ToolDefinition) => !!Setting.value(toolSettingKey(tool.id));

const disabledTools = () => {
	return allMcpTools.filter(t => !isToolEnabled(t));
};

export const describeToolNotFoundFailure = (toolId: string) => {
	const toolSettingName = Setting.settingMetadata(toolSettingKey(toolId))?.label?.();
	// Return "disabled" vs "unknown" differently so the LLM gets actionable feedback.
	if (!toolSettingName) return `Unknown tool: '${toolId}'`;

	const toolsSectionName = Setting.sectionNameToLabel('ai.tools');
	return [
		`# Tool \`${toolId}\` is disabled in Joplin's settings`,
		'',
		'If you need this tool, please ask the user to enable it for you. The user can enable this tool by:',
		'1. opening Joplin\'s settings screen,',
		`2. opening the "${toolsSectionName}" tab, and`,
		`3. enabling the "${toolSettingName}" setting.`,
		'',
		'You can\'t enable this tool yourself. If you need this tool, you\'ll have to ask the user to enable it for you.',
	].join('\n');
};

// A tool that allows the AI to request the user to enable a tool.
// This tool is always enabled if there are disabled tools.
const buildRequestEnableTool = () => {
	const tools = disabledTools();
	const disabledToolIds = tools.map(t => t.id);

	return buildTool<{ tool_id: string }>({
		id: 'disabled_tool_info',
		description: [
			'Learn how to enable a tool: Run this tool if you need one or more of the following **currently-disabled** tools:',
			...tools.map((tool) => `- ${tool.id}: ${substrWithEllipsis(tool.description, 0, 50)}`),
			' ',
			'disabled_tool_info\'s response will include more information about the tool and instructions for how to ask the user to enable it.',
		].join('\n'),
		inputSchema: {
			type: 'object',
			properties: {
				tool_id: {
					type: 'string',
					enum: disabledToolIds,
				},
			},
			required: ['tool_id'],
		},
		userDescription(_input, output) {
			return _('Searched for tool: %s', output.tool_id ?? _('(unknown)'));
		},
		async handler(input) {
			const toolId = input.tool_id;
			if (typeof toolId !== 'string') throw new ToolError('Missing or invalid input_id');
			if (!disabledToolIds.includes(toolId)) throw new ToolError(`Invalid tool_id: ${JSON.stringify(toolId)}. Must be one of ${JSON.stringify(disabledToolIds)}`);

			const description = disabledTools().find(tool => tool.id === input.tool_id)?.description;

			return { tool_id: toolId, description, how_to_enable: describeToolNotFoundFailure(toolId) };
		},
	});
};

export const enabledTools = () => {
	const mcpTools = allMcpTools.filter(isToolEnabled);
	const statusTools = mcpTools.length < allMcpTools.length ? [buildRequestEnableTool()] : [];

	return [...mcpTools, ...statusTools];
};

export const findTool = (id: string) => {
	const t = allMcpTools.find(t => t.id === id);
	if (!t) return null;
	if (!(Setting.value(`ai.tool.${t.id}.enabled`) as boolean)) return null;
	return t;
};
