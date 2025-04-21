import { DialogControl } from '../components/DialogManager';
import { PromptButtonSpec } from '../components/DialogManager/types';
import makeShowMessageBox from './makeShowMessageBox';

type OnPrompt = (buttons: PromptButtonSpec[])=> void;
const makeMockDialogControl = (onPrompt: OnPrompt): DialogControl => {
	return {
		info: jest.fn(),
		error: jest.fn(),
		prompt: jest.fn((_title, _message, buttons) => {
			onPrompt(buttons);
		}),
		showMenu: jest.fn(),
	};
};

describe('makeShowMessageBox', () => {
	test('should resolve with the index of the selected button', async () => {
		const dialogControl = makeMockDialogControl(buttons => {
			buttons.find(button => button.text === 'OK').onPress();
		});
		const showMessageBox = makeShowMessageBox({ current: dialogControl });

		const okButtonIndex = 0;
		expect(await showMessageBox('test')).toBe(okButtonIndex);
	});
});
