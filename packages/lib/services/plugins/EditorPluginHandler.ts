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
				});
			}
		}
	};
};

export default class {

	private viewUpdateAsyncQueue_ = new AsyncActionQueue(100, IntervalType.Fixed);
	private lastSaveBody_: string|null = null;
	private lastSaveId_: string|null = null;
	private lastEditorPluginShown_: string|null = null;

	public constructor(
		private pluginService_: PluginService,
		private onSaveNote_: OnSaveNoteCallback,
	) {
	}

	public emitUpdate(event: UpdateEvent, shownEditorViewIds: string[]) {
		// Avoid emitting update events if the source of the event was probably the last editor save:
		const isDifferent = event.newBody !== this.lastSaveBody_ || event.noteId !== this.lastSaveId_;
		if (shownEditorViewIds.length > 0 && isDifferent) {
			logger.info('emitUpdate:', shownEditorViewIds);
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

	public onEditorPluginShown(editorViewId: string) {
		// Don't double-register callbacks
		if (editorViewId === this.lastEditorPluginShown_) {
			return;
		}
		this.lastEditorPluginShown_ = editorViewId;

		const controller = this.pluginService_.viewControllerByViewId(editorViewId) as WebviewController;
		controller?.onNoteSaveRequested(event => {
			this.scheduleSaveNote_(event.noteId, event.body);
		});
	}

	private scheduleSaveNote_(noteId: string, noteBody: string) {
		this.lastSaveBody_ = noteBody;
		this.lastSaveId_ = noteId;

		return this.onSaveNote_({
			id: noteId,
			body: noteBody,
		});
	}
}
