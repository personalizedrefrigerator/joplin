import { MarkType, Node, Schema } from 'prosemirror-model';
import { Selection } from 'prosemirror-state';
import SelectionFormatting, { MutableSelectionFormatting, defaultSelectionFormatting } from '../../SelectionFormatting';
import { EditorSettings } from '../../types';

const computeSelectionFormatting = (doc: Node, schema: Schema, selection: Selection, settings: EditorSettings): SelectionFormatting => {
	const formatting: MutableSelectionFormatting = {
		...defaultSelectionFormatting,
		selectedText: doc.textBetween(selection.from, selection.to),
		spellChecking: settings.spellcheckEnabled,
	};

	doc.nodesBetween(selection.from, selection.to, (node) => {
		if (node.type === schema.nodes.heading) {
			formatting.headerLevel = node.attrs.level;
		}
		if (node.type === schema.nodes.ordered_list) {
			formatting.inOrderedList = true;
			formatting.listLevel ++;
		}
		if (node.type === schema.nodes.bullet_list) {
			formatting.inUnorderedList = true;
			formatting.listLevel ++;
		}
		if (node.type === schema.nodes.pre_block) {
			formatting.inCode = true;
		}
		const linkMark = node.marks.find(mark => mark.type === schema.marks.link);
		if (linkMark) {
			formatting.linkData = {
				linkText: node.textContent,
				linkURL: linkMark.attrs.href,
			};
			formatting.inLink = true;
		}
	});

	const hasMark = (type: MarkType) => {
		if (!type) {
			throw new Error(`Type not found in schema: ${type}`);
		}

		// If rangeHasMark is given an empty selection, it always returns false.
		// For cursor selections, also check one character to the left.
		const from = selection.empty ? Math.max(0, selection.from - 1) : selection.from;
		const to = selection.to;
		return doc.rangeHasMark(from, to, type);
	};

	formatting.inCode ||= hasMark(schema.marks.code);
	if (formatting.inCode) {
		formatting.unspellCheckableRegion = true;
	}
	formatting.italicized = hasMark(schema.marks.italic);
	formatting.bolded = hasMark(schema.marks.bold);

	if (formatting.unspellCheckableRegion) {
		formatting.spellChecking = false;
	}

	return formatting;
};
export default computeSelectionFormatting;

