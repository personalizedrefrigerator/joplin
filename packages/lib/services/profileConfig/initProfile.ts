import { getCurrentProfile, getProfileFullPath, isSubProfile, loadProfileConfig } from '.';
import Setting from '../../models/Setting';
import { ProfilesInfo } from './types';

export default async (rootProfileDir: string): Promise<ProfilesInfo> => {
	const profileConfig = await loadProfileConfig(`${rootProfileDir}/profiles.json`);
	const profileDir = getProfileFullPath(getCurrentProfile(profileConfig), rootProfileDir);
	const isSub = isSubProfile(getCurrentProfile(profileConfig));
	Setting.setConstant('isSubProfile', isSub);
	Setting.setConstant('rootProfileDir', rootProfileDir);
	Setting.setConstant('profileDir', profileDir);
	return {
		profileConfig,
		profileDir,
		isSubProfile: isSub,
	};
};
