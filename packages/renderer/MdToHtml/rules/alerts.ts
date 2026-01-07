import type * as MarkdownIt from 'markdown-it';
import markdownItGitHubAlerts from '../../vendor/markdown-it-github-alerts';

const plugin = (markdownIt: MarkdownIt) => {
	markdownItGitHubAlerts(markdownIt, {})
};

const assets = () => {
	return [
		{
			inline: true,
			mime: 'text/css',
			text: `
				.markdown-alert {
					--alert-color: var(--alert-color-info);
					border-left: 3px solid var(--alert-color);
					padding-left: 12px;
				}

				.markdown-alert-important {
					--alert-color: var(--alert-color-important);
				}

				.markdown-alert-tip {
					--alert-color: var(--alert-color-tip);
				}

				.markdown-alert-warning, .markdown-alert-caution {
					--alert-color: var(--alert-color-warning);
				}

				.markdown-alert-title {
					display: flex;
					margin-bottom: 12px;
					margin-top: 12px;
					color: var(--alert-color);
					gap: 6px;
					align-items: center;
				}

				.markdown-alert-title > svg {
					fill: currentColor;
				}
			`,
		},
	].map(e => {
		return {
			source: 'alerts',
			...e,
		};
	});
};

export default {
	plugin,
	assets,
};

