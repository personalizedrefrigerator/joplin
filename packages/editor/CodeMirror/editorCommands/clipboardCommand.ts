import { Command } from '@codemirror/view';

export enum ClipboardActionType {
	Cut = 'cut',
	Copy = 'copy',
	Paste = 'paste',
}

interface PasteAction {
	type: ClipboardActionType.Paste;
	text: string;
}

type OnWriteClipboard = (text: string)=> void;
interface CopyAction {
	type: ClipboardActionType.Copy|ClipboardActionType.Cut;
	onWriteClipboard: OnWriteClipboard;
}

type ClipboardAction = CopyAction|PasteAction;

const clipboardCommand = (action: ClipboardAction): Command => (view) => {
	const clipboardData = new DataTransfer();
	if (action.type === ClipboardActionType.Paste) {
		clipboardData.setData('text/plain', action.text);
	}
	const event = new ClipboardEvent(action.type, {
		clipboardData,
	});
	view.contentDOM.dispatchEvent(event);

	const data = clipboardData.getData('text/plain');
	if (data && action.type !== ClipboardActionType.Paste) {
		action.onWriteClipboard(data);
	}

	return true;
};

export default clipboardCommand;
