// The goal of this class is to simplify the integration of the `joplin.views.editor` plugin logic
// in the desktop and mobile app. See here for more information:
//
// packages/lib/services/plugins/api/JoplinViewsEditor.ts

import Logger from '@joplin/utils/Logger';
import AsyncActionQueue, { IntervalType } from '../../AsyncActionQueue';
import eventManager from '../../eventManager';
import { EditorActivationCheckFilterObject } from './api/types';
import type PluginService from './PluginService';
import WebviewController from './WebviewController';

const logger = Logger.create('EditorPluginHandler');

export interface UpdateEvent {
	noteId: string;
	newBody: string;
	windowId: string;
}

interface EmitActivationCheckOptions {
	noteId: string;
	parentWindowId: string;
}

interface SaveNoteEvent {
	id: string;
	body: string;
}

export type OnSaveNoteCallback = (updatedNote: SaveNoteEvent)=> void;

const makeNoteUpdateAction = (pluginService: PluginService, event: UpdateEvent, shownEditorViewIds: string[]) => {
	return async () => {
		for (const viewId of shownEditorViewIds) {
			const controller = pluginService.viewControllerByViewId(viewId) as WebviewController;
			if (controller) {
				controller.emitUpdate({
					noteId: event.noteId,
					newBody: event.newBody,
					windowId: event.windowId,
				});
			}
		}
	};
};

export default class {

	private viewUpdateAsyncQueue_ = new AsyncActionQueue(100, IntervalType.Fixed);

	public constructor(
		private pluginService_: PluginService,
		private onSaveNote_: OnSaveNoteCallback,
	) {
	}

	public emitUpdate(event: UpdateEvent, shownEditorViewIds: string[]) {
		logger.info('emitUpdate:', shownEditorViewIds);
		if (shownEditorViewIds.length > 0) {
			this.viewUpdateAsyncQueue_.push(makeNoteUpdateAction(this.pluginService_, event, shownEditorViewIds));
		}
	}

	public async emitActivationCheck({ noteId, parentWindowId }: EmitActivationCheckOptions) {
		let filterObject: EditorActivationCheckFilterObject = {
			activatedEditors: [],
			effectiveNoteId: noteId,
			windowId: parentWindowId,
		};
		filterObject = await eventManager.filterEmit('editorActivationCheck', filterObject);

		logger.info('emitActivationCheck: responses:', filterObject);

		for (const editor of filterObject.activatedEditors) {
			const controller = this.pluginService_.pluginById(editor.pluginId).viewController(editor.viewId) as WebviewController;
			if (controller.parentWindowId === parentWindowId) {
				controller.setActive(editor.isActive);
			}
		}
	}

	public onEditorPluginShown(editorViewId: string, parentWindowId: string) {
		const controller = this.pluginService_.viewControllerByViewId(editorViewId) as WebviewController;
		const handle = controller?.addRequestSaveNoteListener(event => {
			if (event.windowId === parentWindowId) {
				this.scheduleSaveNote_(event.noteId, event.newBody);
				return true;
			}
			return false;
		});

		const cleanup = () => {
			handle?.remove();
		};
		return cleanup;
	}

	private scheduleSaveNote_(noteId: string, noteBody: string) {
		this.onSaveNote_({
			id: noteId,
			body: noteBody,
		});
	}
}
