import { RegExpCursor } from '@codemirror/search';
import { Extension, Facet, Range, StateEffect, StateField } from '@codemirror/state';
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate, WidgetType } from '@codemirror/view';

export type ImageDescription = {
	id: string;
	description: string;
};
type OnOcrText = (image: ImageDescription)=> void;
// Maps from id -> description
type ImageDescriptions = Map<string, ImageDescription>;

class OcrTextWidget extends WidgetType {
	public constructor(
		private readonly image: ImageDescription,
		private readonly onShowOcrText: OnOcrText,
	) {
		super();
	}

	public override eq(other: WidgetType) {
		if (!(other instanceof OcrTextWidget)) return false;
		return other.image.id === this.image.id && other.image.description === this.image.description;
	}

	public override toDOM(view: EditorView) {
		const wrapper = document.createElement('button');
		wrapper.classList.add('cm-ocr-text-button');

		const icon = document.createElement('i');
		icon.classList.add('fas', 'fa-eye');
		icon.role = 'img';
		icon.ariaHidden = 'true';

		const content = document.createElement('span');
		const ocrPhrase = view.state.phrase('OCR Text');

		const fullLabel = `${ocrPhrase} ${this.image.description}`;
		content.ariaLabel = fullLabel;
		content.title = fullLabel;
		content.textContent = ocrPhrase;

		wrapper.appendChild(icon);
		wrapper.appendChild(content);

		wrapper.onclick = () => {
			this.onShowOcrText(this.image);
		};

		return wrapper;
	}
}

const onOcrTextHandlerFacet = Facet.define<OnOcrText>({
	combine: values => [
		values[0] ?? ((image) => alert(image.description)),
	],
});

const imageDescriptionFacet = Facet.define<ImageDescriptions>({
	combine: (values) => {
		if (values.length === 0) {
			return [];
		}
		if (values.length === 1) {
			if (values[0].size > 0) {
				return [values[0]];
			} else {
				return [];
			}
		}

		const newDescriptions = new Map<string, ImageDescription>();
		for (const descriptions of values) {
			for (const [id, description] of descriptions) {
				newDescriptions.set(id, description);
			}
		}

		return [newDescriptions];
	},
	enables: facet => [
		ViewPlugin.fromClass(class {
			public decorations: DecorationSet;

			public constructor(view: EditorView) {
				this.decorations = this.buildDecorations(view);
			}

			public update(viewUpdate: ViewUpdate) {
				if (viewUpdate.docChanged || viewUpdate.viewportChanged) {
					this.decorations = this.buildDecorations(viewUpdate.view);
				}
			}

			private buildDecorations(view: EditorView) {
				const state = view.state;
				const descriptions = state.facet(facet);
				if (descriptions.length === 0) {
					return Decoration.set([]);
				}

				const decorations: Range<Decoration>[] = [];

				const addDecoration = (id: string, pos: number) => {
					const description = descriptions.map(idToDescription => {
						return idToDescription.get(id);
					}).find(description => !!description);
					if (!description) return;

					decorations.push(Decoration.replace({
						widget: new OcrTextWidget(description, state.facet(onOcrTextHandlerFacet)[0]),
					}).range(pos - id.length, pos));
				};

				for (const { from, to } of view.visibleRanges) {
					let cursor = new RegExpCursor(
						state.doc,
						':/([a-z0-9]{32})', // Asset ID
						{},
						from, to,
					);
					cursor = cursor.next();
					while (!cursor.done) {
						const value = cursor.value;
						if (value) {
							const id = value.match[1];
							addDecoration(id, value.to);
						}

						cursor = cursor.next();
					}
				}

				return Decoration.set(decorations);
			}
		}, {
			decorations: plugin => plugin.decorations,
			provide: plugin => {
				return EditorView.atomicRanges.of(view => {
					return view.plugin(plugin)?.decorations ?? Decoration.none;
				});
			},
		}),
	],
});

const addImageDescriptionEffect = StateEffect.define<ImageDescription>();
const setImageDescriptionsEffect = StateEffect.define<ImageDescription[]>();

export const addImageDescription = (view: EditorView, description: ImageDescription) => {
	view.dispatch({
		effects: addImageDescriptionEffect.of(description),
	});
};

export const setImageDescriptions = (view: EditorView, descriptions: ImageDescription[]) => {
	view.dispatch({
		effects: setImageDescriptionsEffect.of(descriptions),
	});
};

const imageDescriptionState = StateField.define<ImageDescriptions>({
	create: () => new Map(),
	update: (oldValue, tr) => {
		for (const e of tr.effects) {
			if (e.is(addImageDescriptionEffect)) {
				const updated = new Map(oldValue);
				updated.set(e.value.id, e.value);
				return updated;
			} else if (e.is(setImageDescriptionsEffect)) {
				return new Map(
					e.value.map(description => [description.id, description]),
				);
			}
		}
		return oldValue;
	},
	provide: (field) => [
		imageDescriptionFacet.from(field),
	],
});

const imageDescriptionExtension = (onOcrText: OnOcrText): Extension => [
	onOcrTextHandlerFacet.of(onOcrText),
	imageDescriptionState,
];

export default imageDescriptionExtension;
