import { State } from '@joplin/lib/reducer';

// Returns true to prevent the default action.
export type BackHandlerOnBack = ()=> Promise<void>|void;

export interface BackHandlerState {
	id: string;
	enabled: boolean;
	description: string;
	onBack: BackHandlerOnBack;
	runsParent: boolean;
}

export interface NavAction {
	routeName: string;
	clearHistory?: boolean;

	folderId?: string;
	noteId?: string;
	tagId?: string;
	smartFilterId?: string;
	noteHash?: string;
	itemType?: string;
	sharedData?: string;
}

export interface Route {
	routeName: string;
	noteId?: string;
}

export interface AppState extends State {
	showPanelsDialog: boolean;
	isOnMobileData: boolean;
	keyboardVisible: boolean;
	route: Route;
	smartFilterId: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	noteSideMenuOptions: any;
	disableSideMenuGestures: boolean;
	navHistory: NavAction[];

	backHandlers: BackHandlerState[];
	activeBackHandler: BackHandlerState|null;
}
