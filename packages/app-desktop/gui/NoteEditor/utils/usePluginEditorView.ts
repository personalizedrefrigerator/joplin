import { useMemo } from 'react';
import { PluginStates } from '@joplin/lib/services/plugins/reducer';
import getActivePluginEditorView from '@joplin/lib/services/plugins/utils/getActivePluginEditorView';

// If a plugin editor should be shown for the current note, this function will return the plugin and
// associated view.
export default (plugins: PluginStates, shownEditorViewIds: string[]) => {
	return useMemo(() => {
		const { editorPlugin, editorView } = getActivePluginEditorView(plugins);
		if (editorView) {
			if (!shownEditorViewIds.includes(editorView.id)) return { editorPlugin: null, editorView: null };
		}
		return { editorPlugin, editorView };
	}, [plugins, shownEditorViewIds]);
};
