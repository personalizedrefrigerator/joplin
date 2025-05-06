import { BackHandler } from 'react-native';
import { Store } from 'redux';
import { AppState } from '../utils/types';

export type BackButtonHandler = {
	onBackPress: ()=> boolean|Promise<boolean>;
	describeAction: ()=> string|null;
};

export default class BackButtonService {
	private static store: Store<AppState>|null = null;

	public static initialize(store: Store<AppState>) {
		this.store = store;

		BackHandler.addEventListener('hardwareBackPress', () => {
			void this.back();
			return true;
		});
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


