import { Decoration, EditorView } from '@codemirror/view';
import makeReplaceExtension from './utils/makeInlineReplaceExtension';

const indentLists = [
	EditorView.theme({
		['& .cm-listItem']: {
			'position': 'relative',
			'--indent-level': 'calc(var(--cm-list-item-level) * 1em)',
			'margin-inline-start': 'var(--indent-level)',
			'text-indent': 'var(--indent-level)',
		},
	}),
	makeReplaceExtension({
		// hideWhenContainsSelection: false,
		createDecoration: (node, _state, parentTagCounts) => {
			if (node.name === 'ListItem') {
				let markerEnd = 0;
				node.tree.iterate({
					enter(node) {
						if (node.name === 'ListMarker') {
							markerEnd = node.to;
						}
						return markerEnd > 0;
					},
				});
				const level = parentTagCounts.get('ListItem') ?? 0;

				return Decoration.line({
					attributes: {
						style: `--cm-list-item-level: ${Number(level)};`,
					},
					isFullLine: true,
				});
			}
			return null;
		},
	}),
];

export default indentLists;
