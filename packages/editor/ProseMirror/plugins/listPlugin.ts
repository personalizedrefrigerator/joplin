import { BulletList, ListItem, OrderedList, TaskItem, TaskList } from '@tiptap/extension-list';
import trimEmptyParagraphs from '../utils/trimEmptyParagraphs';

const listPlugin = [
	TaskList.extend({
		parseHTML: () => [
			{
				tag: 'ul[data-is-checklist]',
				priority: 52,
			},
		],
	}),
	TaskItem.extend({
		parseHTML: () => [
			{
				tag: 'li.md-checkbox',
				contentElement(node) {
					const result = node.cloneNode(true) as HTMLElement;

					// Empty paragraphs can cause rendering issues.
					trimEmptyParagraphs(result);

					const firstChild = result.children[0];
					if (firstChild?.matches('div.checkbox-wrapper')) {
						firstChild.remove();

						// Trim empty paragraphs without the first child.
						// Without this, multiple empty paragraphs can accumulate between
						// the list item and its sub-lists.
						trimEmptyParagraphs(result);

						result.prepend(...firstChild.childNodes);
					}
					return result;
				},
			},
		],
		addAttributes: () => ({
			checked: {
				parseHTML(node) {
					const checkbox = node.querySelector<HTMLInputElement>('input[type=checkbox]');
					return checkbox?.checked ?? false;
				},
			},
		}),
	}).configure({
		HTMLAttributes: {
			class: 'checklist-item md-checkbox -flex',
		},
	}),

	BulletList,
	OrderedList,
	ListItem,
];

export default listPlugin;
