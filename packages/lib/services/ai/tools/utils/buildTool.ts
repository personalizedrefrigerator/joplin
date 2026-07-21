import { ToolDefinition, ToolOutput } from '../../../ai/types';

const buildTool = <OutputType extends ToolOutput> (spec: ToolDefinition<OutputType>) => {
	return spec as ToolDefinition<unknown>;
};

export default buildTool;
