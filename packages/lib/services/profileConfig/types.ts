export const DefaultProfileId = 'default';
export const CurrentProfileVersion = 2;

export interface Profile {
	name: string;
	id: string;
}

export interface ProfileConfig {
	version: number;
	currentProfileId: string;
	profiles: Profile[];
}

export interface ProfilesInfo {
	profileConfig: ProfileConfig;
	isSubProfile: boolean;
	profileDir: string;
}

export const defaultProfile = (): Profile => {
	return {
		name: 'Default',
		id: DefaultProfileId,
	};
};

export const defaultProfileConfig = (): ProfileConfig => {
	return {
		version: CurrentProfileVersion,
		currentProfileId: DefaultProfileId,
		profiles: [defaultProfile()],
	};
};

export type ProfileSwitchClickHandler = (profileIndex: number)=> void;
