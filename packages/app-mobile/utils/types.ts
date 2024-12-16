import { State } from '@joplin/lib/reducer';
import { AttachFileAction } from '../components/screens/Note/commands/attachFile';

export interface AppState extends State {
	showPanelsDialog: boolean;
	isOnMobileData: boolean;
	keyboardVisible: boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	route: any;
	smartFilterId: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	noteSideMenuOptions: any;
	disableSideMenuGestures: boolean;

	newNoteAttachFileAction: AttachFileAction | null;
}
