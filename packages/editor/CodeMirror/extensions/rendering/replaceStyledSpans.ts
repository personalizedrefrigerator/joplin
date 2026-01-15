import makeInlineReplaceExtension from './utils/makeInlineReplaceExtension';
import { Decoration } from '@codemirror/view';
import htmlNodeInfo from '../../utils/htmlNodeInfo';
import { SyntaxNodeRef } from '@lezer/common';
import { EditorState } from '@codemirror/state';

const hideDecoration = Decoration.replace({});

const isSpanOpeningTag = (node: SyntaxNodeRef, state: EditorState) => (
	node.name === 'HTMLTag' && state.sliceDoc(node.from, node.to).match(/^<span/i)
);
const isSpanClosingTag = (node: SyntaxNodeRef, state: EditorState) => (
	node.name === 'HTMLTag' && state.sliceDoc(node.from, node.to).match(/^<\/span/i)
);
const findSpanClosingTag = (openingTag: SyntaxNodeRef, state: EditorState) => {
	let cursor = openingTag.node.nextSibling;
	let nestedSpanCounter = 1;

	// Find the matching closing tag
	for (; !!cursor && nestedSpanCounter > 0; cursor = cursor.nextSibling) {
		if (isSpanOpeningTag(cursor, state)) {
			nestedSpanCounter ++;
		} else if (isSpanClosingTag(cursor, state)) {
			nestedSpanCounter --;
		}

		if (nestedSpanCounter === 0) {
			break;
		}
	}

	return cursor;
};

const hideSpans = makeInlineReplaceExtension({
	createDecoration: (node, state) => {
		if (!isSpanOpeningTag(node, state) && !isSpanClosingTag(node, state)) return null;

		return hideDecoration;
	},
});

const parseInlineStyles = (css: string) => {
	const testElement = document.createElement('span');
	testElement.style = css;
	return testElement.style;
};
type CssStyleProperties = Partial<Record<keyof CSSStyleDeclaration, string>>;
const serializeInlineStyles = (styles: CssStyleProperties) => {
	const testElement = document.createElement('span');
	for (const key in styles) {
		testElement.style[key] = styles[key];
	}
	return testElement.style.cssText;
};

const styleSpanContent = makeInlineReplaceExtension({
	createDecoration: (node, state) => {
		if (!isSpanOpeningTag(node, state)) return null;
		const htmlNode = htmlNodeInfo(node, state);
		const styleAttr = htmlNode?.getAttr('style');
		if (!styleAttr) return null;

		const styles = parseInlineStyles(styleAttr);

		return Decoration.mark({
			attributes: {
				style: serializeInlineStyles({
					color: styles.color,
					backgroundColor: styles.backgroundColor,
				}),
			},
		});
	},
	getDecorationRange(node, state) {
		const closingTag = findSpanClosingTag(node, state);

		if (closingTag) {
			return [node.to, closingTag.from];
		} else {
			return null;
		}
	},

	// Keep visible even when the cursor is on the same line:
	hideWhenContainsSelection: false,
});

export default [hideSpans, styleSpanContent];
