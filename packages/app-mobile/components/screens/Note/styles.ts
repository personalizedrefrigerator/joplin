import { StyleSheet } from 'react-native';
import { themeStyle, editorFont } from '../../global-style';

// editorFontId corresponds to a Setting.FONT_* value (e.g. Setting.FONT_MENLO).
const getStyles = (themeId: number, editorFontSize: number, editorFontId: number) => {
	const theme = themeStyle(themeId);

	// TODO: Clean up these style names and nesting
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Heterogeneous style entries (view/text/icon styles spread together); typed split would force restructuring
	const styles: Record<string, any> = {
		screen: {
			flex: 1,
			backgroundColor: theme.backgroundColor,
		},
		bodyTextInput: {
			flex: 1,
			paddingLeft: theme.marginLeft,
			paddingRight: theme.marginRight,

			// Add extra space to allow scrolling past end of document, and also to fix this:
			// https://github.com/laurent22/joplin/issues/1437
			// 2020-04-20: removed bottom padding because it doesn't work properly in Android
			// Instead of being inside the scrollable area, the padding is outside thus
			// restricting the view.
			// See https://github.com/laurent22/joplin/issues/3041#issuecomment-616267739
			// paddingBottom: Math.round(dimensions.height / 4),

			textAlignVertical: 'top',
			color: theme.color,
			backgroundColor: theme.backgroundColor,
			fontSize: editorFontSize,
			fontFamily: editorFont(editorFontId),
		},
		noteBodyViewer: {
			flex: 1,
		},
		toggleSpaceButtonContent: {
			flex: 1,
		},
		checkbox: {
			color: theme.color,
			paddingRight: 10,
			paddingLeft: theme.marginLeft,
			paddingTop: 10, // Added for iOS (Not needed for Android??)
			paddingBottom: 10, // Added for iOS (Not needed for Android??)
		},
		markdownButtons: {
			borderColor: theme.dividerColor,
			color: theme.urlColor,
		},
	};

	styles.noteBodyViewerPreview = {
		...styles.noteBodyViewer,
		borderTopColor: theme.dividerColor,
		borderTopWidth: 1,
		borderBottomColor: theme.dividerColor,
		borderBottomWidth: 1,
	};

	styles.titleContainer = {
		flex: 0,
		flexDirection: 'row',
		flexBasis: 'auto',
		paddingLeft: theme.marginLeft,
		borderBottomColor: theme.dividerColor,
		borderBottomWidth: 1,
		maxHeight: '40%',
	};

	styles.titleContainerTodo = { ...styles.titleContainer };
	styles.titleContainerTodo.paddingLeft = 0;

	styles.titleTextInput = {
		flex: 1,
		marginTop: 0,
		paddingLeft: 0,
		color: theme.color,
		fontWeight: 'bold',
		fontSize: theme.fontSize,
		paddingTop: 10, // Added for iOS (Not needed for Android??)
		paddingBottom: 10, // Added for iOS (Not needed for Android??)
	};

	return StyleSheet.create(styles);
};

export default getStyles;
