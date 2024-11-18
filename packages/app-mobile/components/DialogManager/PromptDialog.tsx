import * as React from 'react';
import { Dialog, Divider, Surface, Text, TouchableRipple } from 'react-native-paper';
import { DialogType, PromptDialogData } from './types';
import { StyleSheet } from 'react-native';
import { useMemo } from 'react';
import { themeStyle } from '../global-style';
import Icon from '../Icon';

interface Props {
	dialog: PromptDialogData;
	themeId: number;
}

const useStyles = (themeId: number, isMenu: boolean) => {
	return useMemo(() => {
		const theme = themeStyle(themeId);

		return StyleSheet.create({
			dialogContainer: {
				backgroundColor: theme.backgroundColor,
				borderRadius: 24,
				paddingTop: 24,
				marginLeft: 4,
				marginRight: 4,
			},

			button: {
				padding: 10,
				borderRadius: 24,
			},
			buttonText: {
				color: theme.color4,
				textAlign: 'center',
			},

			dialogContent: {
				paddingBottom: 14,
			},
			dialogActions: {
				paddingBottom: 14,
				paddingTop: 4,

				...(isMenu ? {
					flexDirection: 'column',
					alignItems: 'stretch',
				} : {}),
			},
			dialogLabel: {
				textAlign: isMenu ? 'center' : undefined,
			},
		});
	}, [themeId, isMenu]);
};

const PromptDialog: React.FC<Props> = ({ dialog, themeId }) => {
	const isMenu = dialog.type === DialogType.Menu;
	const styles = useStyles(themeId, isMenu);

	const buttons = dialog.buttons.map((button, index) => {
		const isCheckbox = (button.checked ?? null) !== null;
		const icon = button.checked ? (
			<>
				<Icon
					accessibilityLabel={null}
					style={styles.buttonText}
					name={button.iconChecked ?? 'fas fa-check'}
				/>
				<Text>{' '}</Text>
			</>
		) : null;
		return (
			<TouchableRipple
				key={`${index}-${button.text}`}
				onPress={button.onPress}
				style={styles.button}
				accessibilityRole={isCheckbox ? 'checkbox' : 'button'}
				accessibilityState={isCheckbox ? { checked: button.checked } : null}
				aria-checked={isCheckbox ? button.checked : undefined}
			>
				<Text style={styles.buttonText}>{icon}{button.text}</Text>
			</TouchableRipple>
		);
	});
	const titleComponent = <Text
		variant='titleMedium'
		accessibilityRole='header'
		style={styles.dialogLabel}
	>{dialog.title}</Text>;

	return (
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
					style={styles.dialogLabel}
				>{dialog.message}</Text>
			</Dialog.Content>
			{isMenu ? <Divider/> : null}
			<Dialog.Actions
				style={styles.dialogActions}
			>
				{buttons}
			</Dialog.Actions>
		</Surface>
	);
};

export default PromptDialog;
