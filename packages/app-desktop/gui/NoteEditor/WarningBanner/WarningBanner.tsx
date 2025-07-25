import * as React from 'react';
import { connect } from 'react-redux';
import { AppState } from '../../../app.reducer';
import Setting from '@joplin/lib/models/Setting';
import BannerContent from './BannerContent';
import { _ } from '@joplin/lib/locale';
import onRichTextReadMoreLinkClick from '@joplin/lib/components/shared/NoteEditor/WarningBanner/onRichTextReadMoreLinkClick';
import onRichTextDismissLinkClick from '@joplin/lib/components/shared/NoteEditor/WarningBanner/onRichTextDismissLinkClick';
import { useMemo } from 'react';
import { PluginStates } from '@joplin/lib/services/plugins/reducer';
import PluginService from '@joplin/lib/services/plugins/PluginService';

interface Props {
	bodyEditor: string;
	richTextBannerDismissed: boolean;
	pluginCompatibilityBannerDismissedFor: string[];
	plugins: PluginStates;
}

const onSwitchToLegacyEditor = () => {
	Setting.setValue('editor.legacyMarkdown', true);
};

const onDismissLegacyEditorPrompt = () => {
	Setting.setValue('editor.pluginCompatibilityBannerDismissedFor', [...PluginService.instance().pluginIds]);
};

const incompatiblePluginIds = [
	// cSpell:disable
	'com.septemberhx.Joplin.Enhancement',
	'ylc395.noteLinkSystem',
	'joplin.plugin.cmoptions',
	'com.asdibiase.joplin-languagetool',
	// cSpell:enable
];

const WarningBanner: React.FC<Props> = props => {
	const wysiwygBanner = (
		<BannerContent
			acceptMessage={_('Read more about it')}
			onAccept={onRichTextReadMoreLinkClick}
			onDismiss={onRichTextDismissLinkClick}
			visible={props.bodyEditor === 'TinyMCE' && !props.richTextBannerDismissed}
		>
			{_('This Rich Text editor has a number of limitations and it is recommended to be aware of them before using it.')}
		</BannerContent>
	);

	const incompatiblePluginNames = useMemo(() => {
		if (props.bodyEditor !== 'CodeMirror6') {
			return [];
		}

		const runningPluginIds = Object.keys(props.plugins);

		return runningPluginIds.map((id): string|string[] => {
			if (props.pluginCompatibilityBannerDismissedFor?.includes(id)) {
				return [];
			}

			if (incompatiblePluginIds.includes(id)) {
				return PluginService.instance().pluginById(id).manifest.name;
			} else {
				return [];
			}
		}).flat();
	}, [props.bodyEditor, props.plugins, props.pluginCompatibilityBannerDismissedFor]);

	const markdownPluginBanner = (
		<BannerContent
			acceptMessage={_('Switch to the legacy editor')}
			onAccept={onSwitchToLegacyEditor}
			onDismiss={onDismissLegacyEditorPrompt}
			visible={incompatiblePluginNames.length > 0}
		>
			{_('The following plugins may not support the current markdown editor:')}
			<ul>
				{incompatiblePluginNames.map((name, index) => <li key={index}>{name}</li>)}
			</ul>
		</BannerContent>
	);

	return <>
		{wysiwygBanner}
		{markdownPluginBanner}
	</>;
};

export default connect((state: AppState) => {
	return {
		richTextBannerDismissed: state.settings.richTextBannerDismissed,
		pluginCompatibilityBannerDismissedFor: state.settings['editor.pluginCompatibilityBannerDismissedFor'],
		plugins: state.pluginService.plugins,
	};
})(WarningBanner);
