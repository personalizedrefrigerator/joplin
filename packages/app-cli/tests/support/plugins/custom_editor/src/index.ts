import joplin from 'api';
import { WebViewMessage } from './types';

joplin.plugins.register({
	onStart: async function() {
		const editors = joplin.views.editors;
		const view = await editors.create('test-editor');
		await editors.addScript(view, './editor.js');

		await editors.onActivationCheck(view, async ({ noteId }) => {
			const note = await joplin.data.get(['notes', noteId], { fields: ['body'] });
			console.log('note', note);
			return !!note && note.body?.includes('#edit-test');
		});

		await editors.onUpdate(view, async ({ noteId, newBody }) => {
			editors.postMessage(view, { noteId, content: newBody });
		});

		await editors.onMessage(view, async (message: WebViewMessage) => {
			console.log('save to', message.noteId, 'with', message.content);
			await joplin.data.put(['notes', message.noteId], null, { body: message.content });
		});
	},
});
