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
	const view = await editors.create(editorViewId);
	await editors.setHtml(
		view,
		'<code>Loaded!</code>',
	);
	await editors.onActivationCheck(view, async _event => {
		// Always enable
		return true;
	});

	let noteId = joplin.workspace.selectedNote(windowId)?.id;
	await editors.onUpdate(view, async event => {
		noteId = event.noteId;
	});

	await joplin.commands.register({
		name: `testEditorPluginSave-${editorViewId}`,
		label: `Test editor plugin save for ${editorViewId}`,
		iconName: 'fas fa-music',
		execute: async () => {
			await editors.saveNote(view, {
				noteId,
				body: `Changed by ${editorViewId}`,
			});
		},
	});
};

joplin.plugins.register({
	onStart: async function() {
		await registerEditorPlugin('test-editor-plugin', undefined);
	},
});
