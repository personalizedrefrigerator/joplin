import { LocalizationResult } from '../../../types';
import createTextNode from './createTextNode';
import createUniqueId from './createUniqueId';

interface Options {
	label: LocalizationResult;
	spellCheck: boolean;
	initialContent: string;
	onChange: (newContent: string)=> void;
}

const createTextArea = ({ label, initialContent, spellCheck, onChange }: Options) => {
	const textArea = document.createElement('textarea');
	textArea.spellcheck = spellCheck;
	textArea.oninput = () => {
		onChange(textArea.value);
	};
	textArea.value = initialContent;
	textArea.id = createUniqueId();

	const labelElement = document.createElement('label');
	labelElement.htmlFor = textArea.id;
	labelElement.appendChild(createTextNode(label));

	return {
		label: labelElement,
		textArea,
	};
};

export default createTextArea;
