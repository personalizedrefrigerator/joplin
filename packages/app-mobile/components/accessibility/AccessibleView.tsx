import * as React from 'react';
import { useEffect, useState } from 'react';
import { Platform, View, ViewProps } from 'react-native';
import focusView from '../../utils/focusView';


interface Props extends ViewProps {
	// Prevents a view from being interacted with by accessibility tools, the mouse, or the keyboard focus.
	// See https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inert.
	inert?: boolean;

	// When refocusCounter changes, sets the accessibility focus to this view.
	// May require accessible={true}.
	refocusCounter?: number;
}

const AccessibleView: React.FC<Props> = ({ inert, refocusCounter, children, ...viewProps }) => {
	const [containerRef, setContainerRef] = useState<View|HTMLElement|null>(null);

	// On web, there's no clear way to disable keyboard focus for an element **and its descendants**
	// without accessing the underlying HTML.
	useEffect(() => {
		if (!containerRef || Platform.OS !== 'web') return;

		const element = containerRef as HTMLElement;
		if (inert) {
			element.setAttribute('inert', 'true');
		} else {
			element.removeAttribute('inert');
		}
	}, [containerRef, inert]);

	useEffect(() => {
		if ((refocusCounter ?? null) === null) return;
		if (!containerRef) return;

		focusView('AccessibleView', containerRef as View);
	}, [containerRef, refocusCounter]);

	const canFocus = (refocusCounter ?? null) !== null;

	return <View
		importantForAccessibility={inert ? 'no-hide-descendants' : 'auto'}
		accessibilityElementsHidden={inert}
		aria-hidden={inert}
		pointerEvents={inert ? 'box-none' : 'auto'}

		// On some platforms, views must have accessible=true to be focused.
		accessible={canFocus ? true : undefined}

		ref={setContainerRef}
		{...viewProps}
	>
		{children}
	</View>;
};

export default AccessibleView;
