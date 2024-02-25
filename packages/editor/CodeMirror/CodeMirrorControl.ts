import { EditorView } from '@codemirror/view';
import { EditorCommandType, EditorControl, EditorSettings, LogMessageCallback, ContentScriptData, SearchState } from '../types';
import CodeMirror5Emulation from './CodeMirror5Emulation/CodeMirror5Emulation';
import editorCommands from './editorCommands/editorCommands';
import { EditorSelection, Extension, StateEffect } from '@codemirror/state';
import { updateLink } from './markdown/markdownCommands';
import { SearchQuery, setSearchQuery } from '@codemirror/search';
import PluginLoader from './pluginApi/PluginLoader';
import customEditorCompletion, { editorCompletionSource, enableLanguageDataAutocomplete } from './pluginApi/customEditorCompletion';
import { CompletionSource } from '@codemirror/autocomplete';

interface Callbacks {
	onUndoRedo(): void;
	onSettingsChange(newSettings: EditorSettings): void;
	onClearHistory(): void;
	onRemove(): void;
	onLogMessage: LogMessageCallback;
}

type EditorUserCommand = (...args: any[])=> any;

export default class CodeMirrorControl extends CodeMirror5Emulation implements EditorControl {
	private _pluginControl: PluginLoader;
	private _userCommands: Map<string, EditorUserCommand> = new Map();

	public constructor(
		editor: EditorView,
		private _callbacks: Callbacks,
	) {
		super(editor, _callbacks.onLogMessage);

		this._pluginControl = new PluginLoader(this, _callbacks.onLogMessage);

		this.addExtension(customEditorCompletion());
	}

	public supportsCommand(name: string) {
		return name in editorCommands || this._userCommands.has(name) || super.commandExists(name);
	}

	public override execCommand(name: string, ...args: any[]) {
		let commandOutput;
		if (this._userCommands.has(name)) {
			commandOutput = this._userCommands.get(name)(...args);
		} else if (name in editorCommands) {
			commandOutput = editorCommands[name as EditorCommandType](this.editor);
		} else if (super.commandExists(name)) {
			commandOutput = super.execCommand(name);
		}

		if (name === EditorCommandType.Undo || name === EditorCommandType.Redo) {
			this._callbacks.onUndoRedo();
		}

		return commandOutput;
	}

	public registerCommand(name: string, command: EditorUserCommand) {
		this._userCommands.set(name, command);
	}

	public undo() {
		this.execCommand(EditorCommandType.Undo);
		this._callbacks.onUndoRedo();
	}

	public redo() {
		this.execCommand(EditorCommandType.Redo);
		this._callbacks.onUndoRedo();
	}

	public select(anchor: number, head: number) {
		this.editor.dispatch(this.editor.state.update({
			selection: { anchor, head },
			scrollIntoView: true,
		}));
	}

	public clearHistory() {
		this._callbacks.onClearHistory();
	}

	public setScrollPercent(fraction: number) {
		const maxScroll = this.editor.scrollDOM.scrollHeight - this.editor.scrollDOM.clientHeight;
		this.editor.scrollDOM.scrollTop = fraction * maxScroll;
	}

	public insertText(text: string) {
		this.editor.dispatch(this.editor.state.replaceSelection(text));
	}

	public updateBody(newBody: string) {
		// TODO: doc.toString() can be slow for large documents.
		const currentBody = this.editor.state.doc.toString();

		if (newBody !== currentBody) {
			// For now, collapse the selection to a single cursor
			// to ensure that the selection stays within the document
			// (and thus avoids an exception).
			const mainCursorPosition = this.editor.state.selection.main.anchor;
			const newCursorPosition = Math.min(mainCursorPosition, newBody.length);

			this.editor.dispatch(this.editor.state.update({
				changes: {
					from: 0,
					to: this.editor.state.doc.length,
					insert: newBody,
				},
				selection: EditorSelection.cursor(newCursorPosition),
				scrollIntoView: true,
			}));

			return true;
		}

		return false;
	}

	public updateLink(newLabel: string, newUrl: string) {
		updateLink(newLabel, newUrl)(this.editor);
	}

	public updateSettings(newSettings: EditorSettings) {
		this._callbacks.onSettingsChange(newSettings);
	}

	public setSearchState(newState: SearchState) {
		const query = new SearchQuery({
			search: newState.searchText,
			caseSensitive: newState.caseSensitive,
			regexp: newState.useRegex,
			replace: newState.replaceText,
		});
		this.editor.dispatch({
			effects: setSearchQuery.of(query),
		});
	}

	public addStyles(...styles: Parameters<typeof EditorView.theme>) {
		this.editor.dispatch({
			effects: StateEffect.appendConfig.of(EditorView.theme(...styles)),
		});
	}

	public setContentScripts(plugins: ContentScriptData[]) {
		return this._pluginControl.setPlugins(plugins);
	}

	public remove() {
		this._pluginControl.remove();
		this._callbacks.onRemove();
	}

	//
	// CodeMirror-specific methods
	//

	public joplinExtensions = {
		// Some plugins want to enable autocompletion from *just* that plugin, without also
		// enabling autocompletion for text within code blocks (and other built-in completion
		// sources).
		// To support this, we need to provide extensions that wrap the built-in autocomplete.
		// See https://discuss.codemirror.net/t/autocompletion-merging-override-in-config/7853
		completionSource: (completionSource: CompletionSource) => editorCompletionSource.of(completionSource),
		enableLanguageDataAutocomplete: enableLanguageDataAutocomplete,
	};

	public addExtension(extension: Extension) {
		this.editor.dispatch({
			effects: StateEffect.appendConfig.of([extension]),
		});
	}
}
