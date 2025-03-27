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

export interface EditorContentInfo {
	noteId: string;
	body: string;
}

const makeNoteUpdateAction = (pluginService: PluginService, editorInfo: EditorContentInfo, shownEditorViewIds: string[]) => {
	return async () => {
		for (const viewId of shownEditorViewIds) {
			const controller = pluginService.viewControllerByViewId(viewId) as WebviewController;
			if (controller) {
				controller.emitUpdate({
					noteId: editorInfo.noteId,
					newBody: editorInfo.body,
				});
			}
		}
	};
};

export default class {

	private pluginService_: PluginService;
	private viewUpdateAsyncQueue_ = new AsyncActionQueue(100, IntervalType.Fixed);

	public constructor(pluginService: PluginService) {
		this.pluginService_ = pluginService;
	}

	public emitUpdate(editorInfo: EditorContentInfo, shownEditorViewIds: string[]) {
		logger.info('emitUpdate:', shownEditorViewIds);
		this.viewUpdateAsyncQueue_.push(makeNoteUpdateAction(this.pluginService_, editorInfo, shownEditorViewIds));
	}

	public async emitActivationCheck(editorNoteId: string) {
		let filterObject: EditorActivationCheckFilterObject = {
			activatedEditors: [],
			effectiveNoteId: editorNoteId,
		};
		filterObject = await eventManager.filterEmit('editorActivationCheck', filterObject);

		logger.info('emitActivationCheck: responses:', filterObject);

		for (const editor of filterObject.activatedEditors) {
			const controller = this.pluginService_.pluginById(editor.pluginId).viewController(editor.viewId) as WebviewController;
			controller.setActive(editor.isActive);
		}
	}

}
