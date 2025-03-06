import { GitSourceData, PluginSource } from '../types';

const isGitRepository = (source: PluginSource): source is GitSourceData => {
	return 'cloneUrl' in source && source.cloneUrl !== undefined;
};
export default isGitRepository;
