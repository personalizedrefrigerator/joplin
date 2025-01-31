import joplin from 'api';

joplin.plugins.register({
	onStart: async function() {
		const editors = joplin.views.editors;
		const view = await editors.create('test-editor');
		await editors.addScript(view, './editor.js');

		await editors.onActivationCheck(view, async ({ noteId }) => {
			const note = await joplin.data.get(['notes', noteId]);
			return !!note && note.body.includes('#edit-test');
		});

		await editors.onUpdate(view, async () => {
			await editors.postMessage(view, newBody);
		});

		await editors.onMessage(view, (message: string) => {
			
		});
	},
});
