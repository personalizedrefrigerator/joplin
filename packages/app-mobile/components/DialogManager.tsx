import * as React from 'react';
import { createContext, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform, StyleSheet, useWindowDimensions } from 'react-native';
import { Button, Dialog, Divider, Portal, Surface, Text } from 'react-native-paper';
import Modal from './Modal';
import { _ } from '@joplin/lib/locale';
import shim from '@joplin/lib/shim';
import makeShowMessageBox from '../utils/makeShowMessageBox';
import { themeStyle } from './global-style';

export interface PromptButton {
	text: string;
	onPress?: ()=> void;
	style?: 'cancel'|'default'|'destructive';
}

interface PromptOptions {
	cancelable?: boolean;
}

interface MenuChoice<IdType> {
	text: string;
	id: IdType;
}

export interface DialogControl {
	info(message: string): Promise<void>;
	error(message: string): Promise<void>;
	prompt(title: string, message: string, buttons?: PromptButton[], options?: PromptOptions): void;
	showMenu<IdType>(title: string, choices: MenuChoice<IdType>[]): Promise<IdType>;
}

export const DialogContext = createContext<DialogControl>(null);

interface Props {
	themeId: number;
	children: React.ReactNode;
}

enum DialogType {
	Prompt,
	Menu,
}

interface PromptDialogData {
	type: DialogType;
	key: string;
	title: string;
	message: string;
	buttons: PromptButton[];
	onDismiss: (()=> void)|null;
}

const useStyles = (themeId: number) => {
	const windowSize = useWindowDimensions();

	return useMemo(() => {
		const theme = themeStyle(themeId);

		return StyleSheet.create({
			dialogContainer: {
				backgroundColor: theme.backgroundColor,
				borderRadius: 24,
				paddingTop: 24,
				maxHeight: windowSize.height,
			},
			modalContainer: {
				marginLeft: 'auto',
				marginRight: 'auto',
				marginTop: 'auto',
				marginBottom: 'auto',
				width: Math.max(windowSize.width / 2, 400),
			},

			dialogContent: {
				paddingBottom: 14,
			},
			dialogActions: {
				paddingBottom: 14,
			},
			menuDialogActions: {
				paddingTop: 4,
				flexDirection: 'column',
				alignItems: 'stretch',
			},
			menuDialogLabel: {
				textAlign: 'center',
			},
		});
	}, [windowSize.width, windowSize.height, themeId]);
};

const DialogManager: React.FC<Props> = props => {
	const [dialogModels, setPromptDialogs] = useState<PromptDialogData[]>([]);
	const nextDialogIdRef = useRef(0);

	const dialogControl: DialogControl = useMemo(() => {
		const onDismiss = (dialog: PromptDialogData) => {
			setPromptDialogs(dialogs => dialogs.filter(d => d !== dialog));
		};

		const defaultButtons = [{ text: _('OK') }];
		const control: DialogControl = {
			info: (message: string) => {
				return new Promise<void>((resolve) => {
					control.prompt(_('Info'), message, [{
						text: _('OK'),
						onPress: () => resolve(),
					}]);
				});
			},
			error: (message: string) => {
				return new Promise<void>((resolve) => {
					control.prompt(_('Error'), message, [{
						text: _('OK'),
						onPress: () => resolve(),
					}]);
				});
			},
			prompt: (title: string, message: string, buttons: PromptButton[] = defaultButtons, options?: PromptOptions) => {
				if (Platform.OS !== 'web' && Platform.OS !== 'android') {
					// Alert.alert provides a more native style on iOS.
					Alert.alert(title, message, buttons, options);

					// Alert.alert doesn't work on web.
				} else {
					const cancelable = options?.cancelable ?? true;
					const dialog: PromptDialogData = {
						type: DialogType.Prompt,
						key: `dialog-${nextDialogIdRef.current++}`,
						title,
						message,
						buttons: buttons.map(button => ({
							...button,
							onPress: () => {
								onDismiss(dialog);
								button.onPress?.();
							},
						})),
						onDismiss: cancelable ? () => onDismiss(dialog) : null,
					};

					setPromptDialogs(dialogs => {
						return [
							...dialogs,
							dialog,
						];
					});
				}
			},
			showMenu: function<T>(title: string, choices: MenuChoice<T>[]) {
				return new Promise<T>((resolve) => {
					const dismiss = () => onDismiss(dialog);

					const dialog: PromptDialogData = {
						type: DialogType.Menu,
						key: `menu-dialog-${nextDialogIdRef.current++}`,
						title: '',
						message: title,
						buttons: choices.map(choice => ({
							text: choice.text,
							onPress: () => {
								dismiss();
								resolve(choice.id);
							},
						})),
						onDismiss: dismiss,
					};
					setPromptDialogs(dialogs => {
						return [
							...dialogs,
							dialog,
						];
					});
				});
			},
		};

		return control;
	}, []);
	const dialogControlRef = useRef(dialogControl);
	dialogControlRef.current = dialogControl;

	useEffect(() => {
		shim.showMessageBox = makeShowMessageBox(dialogControlRef);

		return () => {
			dialogControlRef.current = null;
		};
	}, []);

	const styles = useStyles(props.themeId);

	const dialogComponents: React.ReactNode[] = [];
	for (const dialog of dialogModels) {
		const buttons = dialog.buttons.map((button, index) => {
			return (
				<Button key={`${index}-${button.text}`} onPress={button.onPress}>{button.text}</Button>
			);
		});
		const titleComponent = <Text variant='titleMedium' accessibilityRole='header'>{dialog.title}</Text>;

		const isMenu = dialog.type === DialogType.Menu;
		dialogComponents.push(
			<Surface
				testID={'prompt-dialog'}
				style={styles.dialogContainer}
				key={dialog.key}
				elevation={1}
			>
				<Dialog.Content style={styles.dialogContent}>
					{dialog.title ? titleComponent : null}
					<Text
						variant='bodyMedium'
						style={isMenu ? styles.menuDialogLabel : null}
					>{dialog.message}</Text>
				</Dialog.Content>
				{isMenu ? <Divider/> : null}
				<Dialog.Actions
					style={[
						styles.dialogActions,
						isMenu ? styles.menuDialogActions : null,
					]}
				>
					{buttons}
				</Dialog.Actions>
			</Surface>,
		);
	}

	// Web: Use a <Modal> wrapper for better keyboard focus handling.
	return <>
		<DialogContext.Provider value={dialogControl}>
			{props.children}
		</DialogContext.Provider>
		<Portal>
			<Modal
				visible={!!dialogComponents.length}
				containerStyle={styles.modalContainer}
				animationType='fade'
				backgroundColor='rgba(0, 0, 0, 0.1)'
				transparent={true}
				onRequestClose={dialogModels[dialogComponents.length - 1]?.onDismiss}
			>
				{dialogComponents}
			</Modal>
		</Portal>
	</>;
};

export default DialogManager;
