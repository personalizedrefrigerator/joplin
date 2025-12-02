import * as React from 'react';
import { connect } from 'react-redux';
import { _ } from '@joplin/lib/locale';
import onRichTextReadMoreLinkClick from '@joplin/lib/components/shared/NoteEditor/WarningBanner/onRichTextReadMoreLinkClick';
import onRichTextDismissLinkClick from '@joplin/lib/components/shared/NoteEditor/WarningBanner/onRichTextDismissLinkClick';
import { AppState } from '../../utils/types';
import { EditorType } from './types';
import { Banner } from 'react-native-paper';
import { useMemo } from 'react';
import useConvertToMarkdownBanner from '@joplin/lib/components/shared/NoteEditor/WarningBanner/useConvertToMarkdownBanner';
import { MarkupLanguage } from '@joplin/renderer/types';

interface Props {
	editorType: EditorType;
	richTextBannerDismissed: boolean;
	convertToMarkdownBannerDismissed: boolean;

	markupLanguage: MarkupLanguage;
	noteId: string;
	readOnly: boolean;
}

const useBanner = ({ editorType, readOnly, richTextBannerDismissed, convertToMarkdownBannerDismissed, noteId, markupLanguage }: Props) => {
	const convertToMarkdownBanner = useConvertToMarkdownBanner({
		note: { markup_language: markupLanguage, id: noteId },
		dismissed: convertToMarkdownBannerDismissed,
		readOnly,
	});

	return useMemo(() => {
		if (editorType === EditorType.RichText && !richTextBannerDismissed) {
			return {
				label: _('This Rich Text editor has a number of limitations and it is recommended to be aware of them before using it.'),
				actions: [
					{
						label: _('Read more'),
						onPress: onRichTextReadMoreLinkClick,
					},
					{
						label: _('Dismiss'),
						accessibilityHint: _('Hides warning'),
						onPress: onRichTextDismissLinkClick,
					},
				],
			};
		}

		if (convertToMarkdownBanner.enabled) {
			return {
				label: convertToMarkdownBanner.label,
				actions: [
					convertToMarkdownBanner.dismiss,
					convertToMarkdownBanner.convert,
				],
			};
		}

		return null;
	}, [editorType, richTextBannerDismissed, convertToMarkdownBanner]);
};

const WarningBanner: React.FC<Props> = props => {
	const banner = useBanner(props);

	if (!banner) return null;
	return (
		<Banner
			icon='alert-outline'
			actions={banner.actions}
			// Avoid hiding with react-native-paper's "visible" prop to avoid potential accessibility issues
			// related to how react-native-paper hides the banner.
			visible={true}
		>
			{banner.label}
		</Banner>
	);
};

export default connect((state: AppState) => {
	return {
		richTextBannerDismissed: state.settings.richTextBannerDismissed,
		convertToMarkdownBannerDismissed: !state.settings['editor.enableHtmlToMarkdownBanner'],
		selectedNoteIds: state.selectedNoteIds,
	};
})(WarningBanner);
