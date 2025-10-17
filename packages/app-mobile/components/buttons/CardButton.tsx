import * as React from 'react';
import { Card, TouchableRipple } from 'react-native-paper';
import { useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

export enum InstallState {
	NotInstalled,
	Installing,
	Installed,
}

interface Props {
	onPress: ()=> void;
	disabled: boolean;
	children: React.ReactNode;
	style?: ViewStyle;
	testID?: string;
}

const useStyles = (disabled: boolean) => {
	return useMemo(() => {
		const borderRadius = 16;
		// For the TouchableRipple to work on Android, the card needs a transparent background.
		const baseCard = { backgroundColor: 'transparent', borderRadius };
		return StyleSheet.create({
			cardOuterWrapper: {
				// Slightly increase the border radius to prevent the touchable
				// ripple from being observably outside of the container:
				borderRadius: borderRadius + 4,
				// Hide overflow to prevent the touchable ripple from
				// extending outside the button's border.
				overflow: 'hidden',

				// Exclude two pixels of space from the hidden overflow region.
				// This allows the "focus-visible" indicator to be shown on web.
				margin: -2,
				padding: 2,
			},
			cardInnerWrapper: {
				width: '100%',
				borderRadius,
			},
			card: disabled ? {
				...baseCard,
				opacity: 0.7,
			} : baseCard,
			content: {
				gap: 5,
			},
		});
	}, [disabled]);
};


const CardButton: React.FC<Props> = props => {
	const containerIsButton = !!props.onPress;
	const styles = useStyles(props.disabled);

	const CardWrapper = containerIsButton ? TouchableRipple : View;
	return (
		<View style={[styles.cardOuterWrapper, props.style]}>
			<CardWrapper
				accessibilityRole={containerIsButton ? 'button' : null}
				accessible={containerIsButton}
				onPress={props.onPress}
				disabled={props.disabled}
				style={styles.cardInnerWrapper}
				testID={props.testID}
			>
				<Card
					mode='outlined'
					style={styles.card}
				>
					{props.children}
				</Card>
			</CardWrapper>
		</View>
	);
};

export default CardButton;
