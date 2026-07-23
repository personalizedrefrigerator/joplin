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

const toolsSectionName = () => Setting.sectionNameToLabel('ai.tools');
const toolsSettingName = (toolId: string) => {
	const key = toolSettingKey(toolId);
	return Setting.keyExists(key) ? Setting.settingMetadata(key).label?.() : null;
};
export const describeToolNotFoundFailure = (toolId: string) => {
	const settingName = toolsSettingName(toolId);
	// Return "disabled" vs "unknown" differently so the LLM gets actionable feedback.
	if (!settingName) return `Unknown tool: '${toolId}'`;

	const toolsSectionName = Setting.sectionNameToLabel('ai.tools');
	return [
		`# Tool \`${toolId}\` is disabled in Joplin's settings`,
		'',
		'If you need this tool, please ask the user to enable it for you. The user can enable this tool by:',
		'1. opening Joplin\'s settings screen,',
		`2. opening the "${toolsSectionName}" tab, and`,
		`3. enabling the "${settingName}" setting.`,
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
			'**Getting access to more tools:** The following tools/capabilities are currently **disabled** in Joplin\'s settings:',
			'| Tool ID | Setting name | Description |',
			'|---------|--------------|-------------|',
			...tools.map((tool) => `| ${tool.id} | ${toolsSettingName(tool.id)} | ${substrWithEllipsis(tool.description, 0, 50)} |`),
			'',
			'Communication is important here! The user may not know that these tools exist or how to enable them:',
			`If you need one or more of these tools, please ask the user to enable them from the **${toolsSectionName()}** tab of Joplin's settings screen.`,
			'',
			'Run this tool for more information about any of the above disabled tools.',
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
	const t = enabledTools().find(t => t.id === id);
	return t ?? null;
};
