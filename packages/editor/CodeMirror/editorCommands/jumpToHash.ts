import { ensureSyntaxTree } from '@codemirror/language';
import { EditorSelection } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import uslug from '@joplin/fork-uslug/lib/uslug';
import { SyntaxNodeRef } from '@lezer/common';

const jumpToHash = (view: EditorView, hash: string) => {
	const state = view.state;
	const timeout = 1_000; // Maximum time to spend parsing the syntax tree
	let targetLocation: number|undefined = undefined;

	const nodeToText = (node: SyntaxNodeRef) => state.sliceDoc(node.from, node.to);
	const removeQuotes = (quoted: string) => quoted.replace(/^["'](.*)["']$/, '$1');
	const getHtmlNodeId = (node: SyntaxNodeRef) => {
		if (node.from === node.to) return null; // Empty
		const content = node.node.resolveInner(node.from + 1);

		// Search for the "id" attribute
		const attributes = content.getChildren('Attribute');
		for (const attribute of attributes) {
			const nameNode = attribute.getChild('AttributeName');
			const valueNode = attribute.getChild('AttributeValue');

			if (nameNode && valueNode) {
				const name = nodeToText(nameNode).toLowerCase().replace(/^"(.*)"$/, '$1');
				if (name === 'id') {
					return removeQuotes(nodeToText(valueNode));
				}
			}
		}

		return null;
	};

	ensureSyntaxTree(state, state.doc.length, timeout).iterate({
		enter(node) {
			const found = targetLocation !== undefined;
			if (found) return false; // Skip this node

			let matches = false;
			if (node.name.startsWith('SetextHeading') || node.name.startsWith('ATXHeading')) {
				const nodeText = nodeToText(node)
					.replace(/^#+\s/, '') // Leading #s in headers
					.replace(/\n-+$/, ''); // Trailing --s in headers
				matches = hash === uslug(nodeText);
			} else if (node.name === 'HTMLTag' && getHtmlNodeId(node) === hash) {
				matches = true;
			}

			if (matches) {
				targetLocation = node.to;
				return false;
			}

			const keepIterating = !matches;
			return keepIterating;
		},
	});

	if (targetLocation !== undefined) {
		view.dispatch({
			selection: EditorSelection.cursor(targetLocation),
			scrollIntoView: true,
		});
		return true;
	}
	return false;
};

export default jumpToHash;
