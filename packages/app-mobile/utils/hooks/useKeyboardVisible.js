'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const react_1 = require('react');
const react_native_1 = require('react-native');
const useKeyboardVisible = () => {
	const [keyboardVisible, setKeyboardVisible] = (0, react_1.useState)(false);
	const [hasSoftwareKeyboard, setHasSoftwareKeyboard] = (0, react_1.useState)(false);
	(0, react_1.useEffect)(() => {
		const showListener = react_native_1.Keyboard.addListener('keyboardDidShow', () => {
			setKeyboardVisible(true);
			setHasSoftwareKeyboard(true);
		});
		const hideListener = react_native_1.Keyboard.addListener('keyboardDidHide', () => {
			setKeyboardVisible(false);
		});
		return (() => {
			showListener.remove();
			hideListener.remove();
		});
	});
	return (0, react_1.useMemo)(() => {
		return { keyboardVisible, hasSoftwareKeyboard };
	}, [keyboardVisible, hasSoftwareKeyboard]);
};
exports.default = useKeyboardVisible;
// # sourceMappingURL=useKeyboardVisible.js.map
