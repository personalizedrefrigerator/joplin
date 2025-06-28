import { BackHandler, Platform } from 'react-native';

export type BackButtonHandler = {
	onBackPress: ()=> boolean|Promise<boolean>;
	describeAction: ()=> string|null;
};

export default class BackButtonService {
	private static store: Store<AppState>|null = null;

	public static initialize(store: Store<AppState>) {
		this.store = store;

		// On web, `BackHandler.addEventListener` fails with warning "BackHandler is not supported on web and should not be used."
		if (Platform.OS !== 'web') {
			BackHandler.addEventListener('hardwareBackPress', () => {
				void this.back();
				return true;
			});
		}
	}

	public static async back() {
		const handlers = this.store.getState().backHandlers;
		for (let i = handlers.length - 1; i >= 0; i --) {
			if (handlers[i].enabled) {
				await handlers[i].onBack();
				if (!handlers[i].runsParent) {
					break;
				}
			}
		}
	}
}


