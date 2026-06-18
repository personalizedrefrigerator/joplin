// A modal component with different defaults and better support for web.
// On Android and iOS, this wraps the default <Modal> component. On web,
// it uses a <dialog>.

import * as React from 'react';
import { useState } from 'react';
import { Modal, Platform, ScrollViewProps, ViewStyle } from 'react-native';
import FocusControl from '../accessibility/FocusControl/FocusControl';
import { ModalState } from '../accessibility/FocusControl/types';
import Dialog from '@joplin/lib/components/Dialog';
import ModalContent from './ModalContent';

type OnClose = ()=> void;
type OnShow = ()=> void;
export interface ModalElementProps {
	visible: boolean;

	// If provided, acts similar to the React Native modal's "onRequestClose", must be provided
	// but can be `null` to prevent the default close behavior.
	onClose: OnClose|null;
	onShow?: OnShow;

	statusBarTranslucent?: boolean;

	children: React.ReactNode;
	containerStyle?: ViewStyle;
	backgroundColor?: string;
	modalBackgroundStyle?: ViewStyle;
	// Extra styles for the accessibility tools dismiss button. For example,
	// this might be used to display the dismiss button near the top of the
	// screen (rather than the bottom).
	dismissButtonStyle?: ViewStyle;

	// If scrollOverflow is provided, the modal is wrapped in a vertical
	// ScrollView. This allows the user to scroll parts of dialogs into
	// view that would otherwise be clipped by the screen edge.
	scrollOverflow?: boolean|ScrollViewProps;
}

const ModalElement: React.FC<ModalElementProps> = ({
	children,
	containerStyle,
	backgroundColor,
	scrollOverflow,
	modalBackgroundStyle: extraModalBackgroundStyles,
	dismissButtonStyle,
	onClose,
	...forwardedProps
}) => {
	const [modalStatus, setModalStatus] = useState(ModalState.Closed);

	const result = (
		<FocusControl.ModalWrapper state={modalStatus}>
			<ModalComponent
				// supportedOrientations: On iOS, this allows the dialog to be shown in non-portrait orientations.
				supportedOrientations={['portrait', 'portrait-upside-down', 'landscape', 'landscape-left', 'landscape-right']}
				animationType='fade'
				transparent

				// Web:
				onClose={onClose}
				// iOS only: Called after closing
				onDismiss={onClose}
				// Called before closing on Android and sometimes called before closing on iOS
				onRequestClose={onClose}
				{...forwardedProps}
			>
				<ModalContent
					visible={forwardedProps.visible}
					containerStyle={containerStyle}
					backgroundColor={backgroundColor}
					scrollOverflow={scrollOverflow}
					dismissButtonStyle={dismissButtonStyle}
					modalBackgroundStyle={extraModalBackgroundStyles}
					setModalStatus={setModalStatus}
					onClose={onClose}
				>{children}</ModalContent>
			</ModalComponent>
		</FocusControl.ModalWrapper>
	);

	return result;
};

// On web, prefer a <Dialog> element for improved behavior when multiple dialogs
// are open at the same time. See https://github.com/laurent22/joplin/issues/11799.
const ModalComponent = Platform.OS === 'web' ? (props: ModalElementProps) => {
	return <Dialog
		open={props.visible}
		onCancel={props.onClose}
		onShow={props.onShow}
		preventAutoCloseOnCancel={true}
	>
		{props.children}
	</Dialog>;
} : Modal;

export default ModalElement;
