import * as React from 'react';
import { createContext, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { Portal } from 'react-native-paper';
import Modal from './Modal';
import shim from '@joplin/lib/shim';
import makeShowMessageBox from '../../utils/makeShowMessageBox';
import { DialogControl, DialogData, DialogType } from './types';
import useDialogControl from './hooks/useDialogControl';
import PromptDialog from './PromptDialog';
import { themeStyle } from '../global-style';
import TextInputDialog from './TextInputDialog';
import ModalContent from './ModalContent';

export type { DialogControl } from './types';
export const DialogContext = createContext<DialogControl>(null);

interface Props {
	themeId: number;
	children: React.ReactNode;
}

const useStyles = (themeId: number) => {
	return useMemo(() => {
		const theme = themeStyle(themeId);
		const dialogContainer = {
			backgroundColor: theme.backgroundColor,
			borderRadius: theme.borderRadius,
			paddingTop: theme.borderRadius,
			marginLeft: 'auto',
			marginRight: 'auto',

			width: '100%',
		} satisfies ViewStyle;

		return StyleSheet.create({
			dialogContainer: dialogContainer,
			promptDialogContainer: {
				...dialogContainer,
				maxWidth: 450,
			},

			dialogWrapper: {
				position: 'absolute',
				top: 0,
				left: 0,
				alignContent: 'center',
				verticalAlign: 'middle',
				justifyContent: 'center',
			},
		});
	}, [themeId]);
};

const DialogManager: React.FC<Props> = props => {
	const [dialogModels, setPromptDialogs] = useState<DialogData[]>([]);

	const dialogControl = useDialogControl(setPromptDialogs);
	const dialogControlRef = useRef(dialogControl);
	dialogControlRef.current = dialogControl;

	useEffect(() => {
		shim.showMessageBox = makeShowMessageBox(dialogControlRef);

		return () => {
			dialogControlRef.current = null;
		};
	}, []);

	const theme = themeStyle(props.themeId);
	const styles = useStyles(props.themeId);

	const dialogComponents: React.ReactNode[] = [];
	for (let i = 0; i < dialogModels.length; i++) {
		const dialog = dialogModels[i];
		let component;
		if (dialog.type === DialogType.Menu || dialog.type === DialogType.ButtonPrompt) {
			component = (
				<PromptDialog
					dialog={dialog}
					containerStyle={dialog.type === DialogType.ButtonPrompt ? styles.promptDialogContainer : styles.dialogContainer}
					themeId={props.themeId}
				/>
			);
		} else if (dialog.type === DialogType.TextInput) {
			component = (
				<TextInputDialog
					dialog={dialog}
					containerStyle={styles.promptDialogContainer}
					themeId={props.themeId}
				/>
			);
		} else if (dialog.type === DialogType.Custom) {
			component = dialog.render();
		} else {
			const exhaustivenessCheck: never = dialog.type;
			throw new Error(`Unexpected dialog type ${exhaustivenessCheck}`);
		}

		dialogComponents.push(
			<ModalContent
				key={dialog.key}
				onClose={dialog.onDismiss}
				visible={true}
				setModalStatus={null}
				containerStyle={styles.dialogWrapper}
				backgroundColor='rgba(0,0,0,0.4)'
				scrollOverflow={false}
			>
				{component}
			</ModalContent>,
		);
	}

	return <>
		<DialogContext.Provider value={dialogControl}>
			{props.children}
		</DialogContext.Provider>
		<Portal>
			<Modal
				visible={!!dialogComponents.length}
				scrollOverflow={true}
				backgroundColor={theme.backgroundColorTransparent2}
				onClose={dialogModels[dialogComponents.length - 1]?.onDismiss}
			>
				{dialogComponents}
			</Modal>
		</Portal>
	</>;
};

export default DialogManager;
