import * as React from 'react';
import { Button, Dialog, Divider, Surface, Text } from 'react-native-paper';
import { DialogType, PromptDialogData } from './types';
import { useWindowDimensions, StyleSheet, ScrollView } from 'react-native';
import { useMemo } from 'react';
import { themeStyle } from '../global-style';

interface Props {
	dialog: PromptDialogData;
	themeId: number;
}

const buttonHeight = 40;

const useStyles = (themeId: number, buttonCount: number, isMenu: boolean) => {
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

			buttonScroller: {
				height: isMenu ? Math.min(buttonCount * buttonHeight, windowSize.height * 2 / 3) : buttonHeight,
			},
			buttonScrollerContent: {
				flexDirection: 'row',
				justifyContent: 'flex-end',
				flexWrap: 'wrap',
			},
			actionButton: {
				minHeight: buttonHeight,
			},

			dialogContent: {
				paddingBottom: 14,
			},
			dialogActions: {
				paddingBottom: 14,
				paddingTop: 4,
			},
			menuDialogActions: {
				flexDirection: 'column',
				alignContent: 'stretch',
			},
			menuDialogLabel: {
				textAlign: 'center',
			},
		});
	}, [windowSize.height, themeId, buttonCount, isMenu]);
};

const PromptDialog: React.FC<Props> = ({ dialog, themeId }) => {
	const isMenu = dialog.type === DialogType.Menu;
	const styles = useStyles(themeId, dialog.buttons.length, isMenu);

	const buttons = dialog.buttons.map((button, index) => {
		return (
			<Button
				key={`${index}-${button.text}`}
				onPress={button.onPress}
				style={styles.actionButton}
			>{button.text}</Button>
		);
	});
	const titleComponent = <Text
		variant='titleMedium'
		accessibilityRole='header'
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
					style={isMenu ? styles.menuDialogLabel : null}
				>{dialog.message}</Text>
			</Dialog.Content>
			{isMenu ? <Divider/> : null}
			<Dialog.Actions
				style={[
					styles.dialogActions,
				]}
			>
				<ScrollView contentContainerStyle={[
					styles.buttonScrollerContent,
					isMenu ? styles.menuDialogActions : null,
				]} style={[
					styles.buttonScroller,
				]}>
					{buttons}
				</ScrollView>
			</Dialog.Actions>
		</Surface>
	);
};

export default PromptDialog;
