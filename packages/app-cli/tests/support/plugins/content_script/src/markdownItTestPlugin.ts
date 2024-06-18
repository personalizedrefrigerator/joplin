
export default function(context) { 
	return {
		plugin: function(markdownIt, _options) {
			const contentScriptId = context.contentScriptId;

			const defaultRender = markdownIt.renderer.rules.fence || function(tokens, idx, options, env, self) {
				return self.renderToken(tokens, idx, options, env, self);
			};
		
			markdownIt.renderer.rules.fence = function(tokens, idx, options, env, self) {
				const token = tokens[idx];
				if (token.info !== 'justtesting') return defaultRender(tokens, idx, options, env, self);

				const postMessageWithResponseTest = `
					webviewApi.postMessage('${contentScriptId}', 'justtesting').then(function(response) {
						console.info('Got response in content script: ' + response);
					});
					return false;
				`;

				// Rich text editor support:
				// The joplin-editable and joplin-source CSS classes mark the generated div
				// as a region that needs special processing when converting back to markdown.
				// This element helps Joplin reconstruct the original markdown.
				const richTextEditorMetadata = `
					<pre
						class="joplin-source"
						data-joplin-language="justtesting"
						data-joplin-source-open="\`\`\`justtesting\n"
						data-joplin-source-close="\`\`\`"
					>${markdownIt.utils.escapeHtml(token.content)}</pre>
				`;

				return `
					<div class="just-testing joplin-editable">
						${richTextEditorMetadata}

						<p>JUST TESTING: <pre>${markdownIt.utils.escapeHtml([token.content.trim(), 10, 'x'].join('..'))}</pre></p>
						<p><a href="#" onclick="${postMessageWithResponseTest.replace(/\n/g, ' ')}">Click to post a message "justtesting" to plugin and check the response in the console</a></p>
					</div>
				`;
			};
			const originalRender = markdownIt.renderer.render;
			markdownIt.renderer.render = (...args: any) => {
				let result = originalRender.apply(markdownIt.renderer, args);
				console.log('INT(0)', result);
				result += `<style onload="console.log('test')"></style>`;
				console.log('INT(1)', result);

				return result;
			};
		},
		assets: function() {
			return [
				{ name: 'markdownItTestPlugin.css' }
			];
		},
	}
}
