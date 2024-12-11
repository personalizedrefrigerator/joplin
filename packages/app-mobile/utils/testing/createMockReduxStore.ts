import { createReduxStore } from '@joplin/lib/testing/test-utils';
import appDefaultState from '../appDefaultState';
import Setting from '@joplin/lib/models/Setting';

const createMockReduxStore = () => {
	return createReduxStore({
		...appDefaultState,
		settings: Setting.toPlainObject(),
	});
};
export default createMockReduxStore;
