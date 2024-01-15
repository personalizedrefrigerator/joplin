import Setting from '@joplin/lib/models/Setting';
import RepositoryApi from '@joplin/lib/services/plugins/RepositoryApi';

let repoApi_: RepositoryApi|null = null;
const repoApi = () => {
	if (repoApi_) return repoApi_;

	repoApi_ = RepositoryApi.ofDefaultJoplinRepo(Setting.value('tempDir'));
	return repoApi_;
};

export default repoApi;