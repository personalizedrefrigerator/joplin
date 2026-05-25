
import * as React from 'react';
import { TextStyle, Text, StyleProp } from 'react-native';

import { FontAwesome5 } from '@react-native-vector-icons/fontawesome5';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { Ionicons } from '@react-native-vector-icons/ionicons';

// The icon libraries each type `name` as a literal union of glyph names. Their own
// `FooIconName` exports resolve to `string | number | symbol` here (the JSON glyph
// maps don't carry strict keys through `keyof`), so derive names via
// `ComponentProps<typeof Icon>['name']` instead — exported below for shared use.
export type IoniconName = React.ComponentProps<typeof Ionicons>['name'];
type MaterialIconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

// FA5's `name` is discriminated on `iconStyle`; extract each branch's name union.
type FA5Props = React.ComponentProps<typeof FontAwesome5>;
type FA5BrandName = Extract<FA5Props, { iconStyle: 'brand' }>['name'];
type FA5RegularName = Extract<FA5Props, { iconStyle: 'regular' }>['name'];
type FA5SolidName = Extract<FA5Props, { iconStyle: 'solid' }>['name'];

interface Props {
	name: string;
	style: StyleProp<TextStyle>;

	// If `null` is given, the content must be labeled elsewhere.
	accessibilityLabel: string|null;

	allowFontScaling?: boolean;
}

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
	// Annotate with `as const` so the value stays a literal union (icon libs type this prop strictly).
	const importantForAccessibility = accessibilityHidden ? 'no-hide-descendants' as const : 'yes' as const;

	const sharedProps = {
		importantForAccessibility, // Android
		accessibilityElementsHidden: accessibilityHidden, // iOS
		'aria-hidden': accessibilityHidden, // Web
		// Icon libs type `accessibilityLabel` as `string | undefined`; coerce our explicit `null`.
		accessibilityLabel: props.accessibilityLabel ?? undefined,
		style: props.style,
		allowFontScaling: props.allowFontScaling,
	};

	if (namePrefix.match(/^fa[bsr]?$/)) {
		// FA5's typings discriminate the `name` union on `iconStyle`, so each branch returns its
		// own JSX with the matching name-type cast. Names that don't belong to the selected style
		// render as a fallback glyph at runtime.
		if (namePrefix.startsWith('fab')) {
			return (
				<FontAwesome5
					name={nameSuffix as FA5BrandName}
					iconStyle='brand'
					{...sharedProps}
				/>
			);
		} else if (namePrefix.startsWith('far')) {
			return (
				<FontAwesome5
					name={nameSuffix as FA5RegularName}
					iconStyle='regular'
					{...sharedProps}
				/>
			);
		} else {
			return (
				<FontAwesome5
					name={nameSuffix as FA5SolidName}
					iconStyle='solid'
					{...sharedProps}
				/>
			);
		}
	} else if (namePrefix === 'material') {
		return <MaterialDesignIcons name={nameSuffix as MaterialIconName} {...sharedProps}/>;
	} else if (namePrefix === 'ionicon') {
		return <Ionicons name={nameSuffix as IoniconName} {...sharedProps}/>;
	} else if (namePrefix === 'text') {
		return (
			<Text
				style={props.style}
				aria-hidden={accessibilityHidden}
				importantForAccessibility={importantForAccessibility}
				accessibilityElementsHidden={accessibilityHidden}
			>
				{nameSuffix}
			</Text>
		);
	} else {
		return <FontAwesome5 name='cog' iconStyle='solid' {...sharedProps}/>;
	}
};

export default Icon;
