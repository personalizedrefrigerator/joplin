import * as React from 'react';
import { useEffect } from 'react';
import { AccessibilityInfo, Platform, Text, TextProps } from 'react-native';

interface Props extends TextProps {
	children: string[]|string;
}

const AccessibilityLiveText: React.FC<Props> = ({ children, ...rest }) => {
	const textContent = typeof children === 'string' ? children : children.join(' ');
	useEffect(() => {
		if (Platform.OS === 'ios' && textContent) {
			AccessibilityInfo.announceForAccessibility(textContent);
		}
	}, [textContent]);

	return <Text
		accessibilityLiveRegion='polite'
		aria-live='polite'
		{...rest}
	>{children}</Text>;
};

export default AccessibilityLiveText;
