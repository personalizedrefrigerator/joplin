import { useMemo } from 'react';
import { AccessibilityActionEvent, NativeSyntheticEvent } from 'react-native';

// Allows adding an onLongPress listener in a more accessible way.
// In particular:
// - For keyboard accessibility (web only) adds an onContextMenu listener.
// - Adds a longpress accessibility action. This causes TalkBack to announce that
//   a longpress accessibility action is available.
const useOnLongPressProps = (onLongPress: ()=> void) => {
	return useMemo(() => {
		if (!onLongPress) return {};

		return {
			onContextMenu: (event: NativeSyntheticEvent<unknown>) => {
				event.preventDefault();
				onLongPress();
			},
			onLongPress,
			accessibilityActions: [
				{ name: 'longpress', label: 'Long press' },
			],
			onAccessibilityAction: (event: AccessibilityActionEvent)=>{
				if (event.nativeEvent.actionName === 'longpress') {
					onLongPress();
				}
			},
		};
	}, [onLongPress]);
};

export default useOnLongPressProps;
