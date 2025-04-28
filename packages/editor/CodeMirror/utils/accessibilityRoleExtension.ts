import { Decoration, EditorView } from '@codemirror/view';
import { ViewPlugin, DecorationSet, ViewUpdate } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';

const paragraphRoleDecoration = Decoration.line({
	attributes: { role: 'paragraph' },
});

const computeDecorations = (view: EditorView) => {
	const doc = view.state.doc;
	const decorationBuilder = new RangeSetBuilder<Decoration>();
	let lastVisibleLine = 0;
	for (const { from, to } of view.visibleRanges) {
		const fromLineNumber = Math.max(doc.lineAt(from).number - 1, 1);
		const toLineNumber = Math.min(doc.lineAt(to).number + 1, doc.lines);
		for (let i = Math.max(lastVisibleLine, fromLineNumber); i <= toLineNumber; i++) {
			const line = doc.line(i);
			if (line.text !== '') {
				decorationBuilder.add(line.from, line.from, paragraphRoleDecoration);
			}
		}
		lastVisibleLine = toLineNumber;
	}
	return decorationBuilder.finish();
};

const accessibilityRoleExtension = ViewPlugin.fromClass(class {
	public decorations: DecorationSet;

	public constructor(view: EditorView) {
		this.decorations = computeDecorations(view);
	}

	public update(viewUpdate: ViewUpdate) {
		if (viewUpdate.docChanged || viewUpdate.viewportChanged) {
			this.decorations = computeDecorations(viewUpdate.view);
		}
	}
}, {
	decorations: pluginVal => pluginVal.decorations,
});

export default accessibilityRoleExtension;
