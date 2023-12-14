
import * as React from 'react';
import { useMemo } from 'react';
import { Image, View, StyleSheet } from 'react-native';
const FontAwesomeIcon = require('react-native-vector-icons/FontAwesome5').default;

// A style that applies to both PNG and font icons.
export interface IconStyle {
	size: number;
	width?: number;
	height?: number;
	align: 'center'|'auto';
	color: string;
	opacity: number;
}

interface Props {
	name: string;

	style: IconStyle;

	// If `null` is given, the content must be labeled elsewhere.
	accessibilityLabel: string|null;
}

const useStyles = (iconStyle: IconStyle) => {
	return useMemo(() => {
		// Even using fontSize: iconStyle.size, font icons are slightly
		// larger than iconStyle.size. We thus adjust by textScale:
		const textScale = 0.77;

		return StyleSheet.create({
			imageStyle: {
				width: iconStyle.size,
				height: iconStyle.size,
				alignSelf: iconStyle.align,
				opacity: iconStyle.opacity,
				tintColor: iconStyle.color,
			},
			imageContainerStyle: {
				width: iconStyle.width,
			},
			textStyle: {
				color: iconStyle.color,
				opacity: iconStyle.opacity,
				textAlign: iconStyle.align,
				width: iconStyle.width,
				height: iconStyle.height,
				fontSize: iconStyle.size * textScale,
			},
		});
	}, [
		iconStyle.size, iconStyle.width, iconStyle.height, iconStyle.color, iconStyle.align, iconStyle.opacity,
	]);
};

const Icon: React.FC<Props> = props => {
	// Matches:
	//  1. A prefix of word characters (\w+)
	//  2. A suffix of non-spaces (\S+)
	// An "fa-" at the beginning of the suffix is ignored.
	const nameMatch = props.name.match(/^(\w+)\s+(?:fa-)?(\S+)$/);

	const namePrefix = nameMatch ? nameMatch[1] : '';
	const nameSuffix = nameMatch ? nameMatch[2] : props.name;

	// If there's no label, make sure that the screen reader doesn't try
	// to read the characters from the icon font (they don't make sense
	// without the icon font applied).
	const accessibilityHidden = props.accessibilityLabel === null;

	const styles = useStyles(props.style);

	if (namePrefix === 'joplin') {
		if (nameSuffix === 'joplin-cloud') {
			return (
				<View style={styles.imageContainerStyle}>
					<Image
						source={require('./png-icons/joplin-cloud.png')}
						style={styles.imageStyle}
					/>
				</View>
			);
		} else {
			throw new Error(`Unknown Joplin icon ${nameSuffix}`);
		}
	} else {
		return (
			<FontAwesomeIcon
				brand={namePrefix.startsWith('fab')}
				solid={namePrefix.startsWith('fas')}
				accessibilityLabel={props.accessibilityLabel}
				aria-hidden={accessibilityHidden}
				importantForAccessibility={
					accessibilityHidden ? 'no-hide-descendants' : 'yes'
				}
				name={nameSuffix}
				style={styles.textStyle}
			/>
		);
	}
};

export default Icon;
