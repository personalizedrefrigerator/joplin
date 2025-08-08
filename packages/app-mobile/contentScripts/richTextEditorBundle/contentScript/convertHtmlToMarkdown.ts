const TurndownService = require('@joplin/turndown');
const turndownPluginGfm = require('@joplin/turndown-plugin-gfm').gfm;
const joplinTurndownOptions = require('@joplin/turndown/src/joplin-config.js');

// Avoid using @joplin/lib/HtmlToMd here. HtmlToMd may cause several megabytes
// of additional JavaScript and supporting data to be included.

const convertHtmlToMarkdown = (html: string|HTMLElement) => {
	const turndown = new TurndownService({
		...joplinTurndownOptions,
		expandNonbreakingSpaces: true,
	});
	turndown.use(turndownPluginGfm);
	turndown.remove('script');
	turndown.remove('style');
	const md = turndown.turndown(html);
	return md;
};

export default convertHtmlToMarkdown;
