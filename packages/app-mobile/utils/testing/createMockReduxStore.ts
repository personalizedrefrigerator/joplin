import { createReduxStore } from '@joplin/lib/testing/test-utils';
import appDefaultState from '../appDefaultState';
import Setting from '@joplin/lib/models/Setting';

const defaultState = {
	...appDefaultState,
	// Mocking theme in the default state is necessary to prevent "Theme not set!" warnings.
	settings: { theme: Setting.THEME_LIGHT },
};

const createMockReduxStore = () => {
	return createReduxStore(defaultState);
};
export default createMockReduxStore;
