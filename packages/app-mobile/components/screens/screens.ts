import Notes from './Notes/Notes';
import Note from './Note/Note';
import { _ } from '@joplin/lib/locale';
import Tags from './Tags';
import DropboxLogin from './DropboxLogin';
import JoplinCloudLoginScreen from './JoplinCloudLoginScreen';
import EncryptionConfig from './EncryptionConfig';
import UpgradeSyncTargetScreen from './UpgradeSyncTargetScreen';
import ShareManager from './ShareManager';
import ProfileSwitcher from '../ProfileSwitcher/ProfileSwitcher';
import ProfileEditor from '../ProfileSwitcher/ProfileEditor';
import LogScreen from './LogScreen';
import Status from './Status';
import SearchScreen from './SearchScreen';
import ConfigScreen from './ConfigScreen/ConfigScreen';
const Folder = require('./Folder');
const OneDriveLogin = require('./OneDriveLogin');

const screens = {
	Notes: {
		screen: Notes,
		label: () => _('Note list'),
	},
	Note: {
		screen: Note,
		label: () => _('Note'),
	},
	Tags: {
		screen: Tags,
		label: () => _('Tags'),
	},
	Folder: {
		screen: Folder,
		label: () => _('Edit notebook'),
	},
	OneDriveLogin: {
		screen: OneDriveLogin,
		label: () => _('Login with OneDrive'),
	},
	DropboxLogin: {
		screen: DropboxLogin,
		label: () => _('Login with Dropbox'),
	},
	JoplinCloudLogin: {
		screen: JoplinCloudLoginScreen,
		label: () => _('Joplin Cloud Login'),
	},
	EncryptionConfig: {
		screen: EncryptionConfig,
		label: () => _('Encryption config'),
	},
	UpgradeSyncTarget: {
		screen: UpgradeSyncTargetScreen,
		label: () => _('Sync target upgrade'),
	},
	ShareManager: {
		screen: ShareManager,
		label: () => _('Shares'),
	},
	ProfileSwitcher: {
		screen: ProfileSwitcher,
		label: () => _('Profiles'),
	},
	ProfileEditor: {
		screen: ProfileEditor,
		label: () => _('Edit profile'),
	},
	Log: {
		screen: LogScreen,
		label: () => _('Log'),
	},
	Status: {
		screen: Status,
		label: () => _('Sync status'),
	},
	Search: {
		screen: SearchScreen,
		label: () => _('Search'),
	},
	Config: {
		screen: ConfigScreen,
		label: () => _('Configuration'),
	},
};

export const describeRoute = (routeName: string) => {
	if (routeName in screens) {
		return screens[routeName as keyof typeof screens].label();
	}
	return null;
};

export default screens;

