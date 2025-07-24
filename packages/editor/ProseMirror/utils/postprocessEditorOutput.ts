
const fixChecklists = (container: HTMLElement) => {
	const checklistItems = container.querySelectorAll('ul[data-is-checklist] > li');
	for (const item of checklistItems) {
		// All items in a checklist should have checkboxes. Sometimes, new items
		// added to checklists have incorrect checked/unchecked information.
		if (!item.classList.contains('md-checkbox') && item.firstElementChild.tagName !== 'INPUT') {
			const checkbox = document.createElement('input');
			checkbox.type = 'checkbox';
			item.prepend(checkbox);
		}
	}
};

const postprocessEditorOutput = (output: HTMLElement) => {
	fixChecklists(output);
};

export default postprocessEditorOutput;
