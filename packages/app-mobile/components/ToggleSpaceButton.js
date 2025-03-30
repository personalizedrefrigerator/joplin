'use strict';
// On some devices, the SafeAreaView conflicts with the KeyboardAvoidingView, creating
// additional (or a lack of additional) space at the bottom of the screen. Because this
// is different on different devices, this button allows toggling additional space a the bottom
// of the screen to compensate.
Object.defineProperty(exports, '__esModule', { value: true });
// Works around https://github.com/facebook/react-native/issues/13393 by adding additional
// space below the given component when the keyboard is visible unless a button is pressed.
const Setting_1 = require('@joplin/lib/models/Setting');
const theme_1 = require('@joplin/lib/theme');
const React = require('react');
const react_1 = require('react');
const react_native_1 = require('react-native');
const IconButton_1 = require('./IconButton');
const useKeyboardVisible_1 = require('../utils/hooks/useKeyboardVisible');
const ToggleSpaceButton = (props) => {
	const [additionalSpace, setAdditionalSpace] = (0, react_1.useState)(0);
	const [decreaseSpaceBtnVisible, setDecreaseSpaceBtnVisible] = (0, react_1.useState)(true);
	// Some devices need space added, others need space removed.
	const additionalPositiveSpace = 14;
	const additionalNegativeSpace = -14;
	// Switch from adding +14px to -14px.
	const onDecreaseSpace = (0, react_1.useCallback)(() => {
		setAdditionalSpace(additionalNegativeSpace);
		setDecreaseSpaceBtnVisible(false);
		Setting_1.default.setValue('editor.mobile.removeSpaceBelowToolbar', true);
	}, [setAdditionalSpace, setDecreaseSpaceBtnVisible, additionalNegativeSpace]);
	(0, react_1.useEffect)(() => {
		if (Setting_1.default.value('editor.mobile.removeSpaceBelowToolbar')) {
			onDecreaseSpace();
		}
	}, [onDecreaseSpace]);
	const theme = (0, theme_1.themeStyle)(props.themeId);
	const decreaseSpaceButton = (React.createElement(React.Fragment, null,
		React.createElement(react_native_1.View, { style: {
			height: additionalPositiveSpace,
			zIndex: -2,
		} }),
		React.createElement(IconButton_1.default, { themeId: props.themeId, description: 'Move toolbar to bottom of screen', containerStyle: {
			height: additionalPositiveSpace,
			width: '100%',
			// Ensure that the icon is near the bottom of the screen,
			// and thus invisible on devices where it isn't necessary.
			position: 'absolute',
			bottom: 0,
			// Don't show the button on top of views with content.
			zIndex: -1,
			alignItems: 'center',
		}, onPress: onDecreaseSpace, iconName: 'material chevron-down', iconStyle: { color: theme.color } })));
	const { keyboardVisible } = (0, useKeyboardVisible_1.default)();
	const windowSize = (0, react_native_1.useWindowDimensions)();
	const isPortrait = windowSize.height > windowSize.width;
	const spaceApplicable = keyboardVisible && react_native_1.Platform.OS === 'ios' && isPortrait;
	const style = { marginBottom: spaceApplicable ? additionalSpace : 0, ...props.style };
	return (React.createElement(react_native_1.View, { style: style },
		props.children,
		decreaseSpaceBtnVisible && spaceApplicable ? decreaseSpaceButton : null));
};
exports.default = ToggleSpaceButton;
// # sourceMappingURL=ToggleSpaceButton.js.map
