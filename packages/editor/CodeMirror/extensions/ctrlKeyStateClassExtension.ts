import { StateEffect, StateField, Transaction } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

const ctrlKeyToggleEffect = StateEffect.define<boolean>();

export const ctrlKeyDownField = StateField.define<boolean>({
	create: () => false,
	update: (value: boolean, transaction: Transaction) => {
		const toggleEffect = transaction.effects.find(effect => effect.is(ctrlKeyToggleEffect));
		if (toggleEffect) {
			return toggleEffect.value;
		}
		return value;
	},
	provide: (field) => [
		EditorView.editorAttributes.from(field, on => ({
			class: on ? '-ctrl-key-pressed' : '',
		})),
		...(() => {
			const onEvent = (event: KeyboardEvent|MouseEvent, view: EditorView) => {
				if (event.ctrlKey !== view.state.field(ctrlKeyDownField)) {
					view.dispatch({
						effects: [
							ctrlKeyToggleEffect.of(event.ctrlKey),
						],
					});
				}
			};

			return [
				EditorView.domEventObservers({
					keydown: onEvent,
					keyup: onEvent,
					mouseenter: onEvent,
				}),
			];
		})(),
	],
});

export default [
	ctrlKeyDownField,
];
