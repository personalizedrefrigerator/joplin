// Allows referencing the Joplin global:
/* eslint-disable no-undef */

// Allows the `joplin-manifest` block comment:
/* eslint-disable multiline-comment-style */

/* joplin-manifest:
{
	"id": "org.joplinapp.plugins.example.editorPlugin",
	"manifest_version": 1,
	"app_min_version": "3.1",
	"name": "JS Bundle test",
	"description": "JS Bundle Test plugin",
	"version": "1.0.0",
	"author": "",
	"homepage_url": "https://joplinapp.org"
}
*/

const registerEditorPlugin = async (editorViewId, windowId) => {
	const editors = joplin.views.editors;
	const view = await editors.create(editorViewId, { windowId });
	await editors.setHtml(
		view,
		`<div id="frame-summary">
			Editor plugin:
			<code id="view-id-base">${editorViewId}</code>
			for window: <code>${encodeURI(windowId)}</code>
		</div>`,
	);
	await editors.onActivationCheck(view, async _event => {
		// Always enable
		return true;
	});
};

joplin.plugins.register({
	onStart: async function() {
		// Register two different editor plugins with only the main window:
		await registerEditorPlugin('test-editor-plugin-1', undefined);
		await registerEditorPlugin('test-editor-plugin-2', undefined);
	},
});
