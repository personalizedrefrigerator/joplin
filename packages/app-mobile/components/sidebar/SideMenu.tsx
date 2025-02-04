import * as React from 'react';
import { AccessibilityInfo, Animated, Dimensions, Easing, I18nManager, LayoutChangeEvent, PanResponder, Pressable, StyleSheet, useWindowDimensions, View, ViewStyle } from 'react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AccessibleView from '../accessibility/AccessibleView';
import { _ } from '@joplin/lib/locale';
import useReduceMotionEnabled from '../../utils/hooks/useReduceMotionEnabled';

export enum SideMenuPosition {
	Left = 'left',
	Right = 'right',
	Bottom = 'bottom',
}

export type OnChangeCallback = (isOpen: boolean)=> void;

interface Props {
	isOpen: boolean;

	menu: React.ReactNode;
	children: React.ReactNode|React.ReactNode[];
	overlayColor: string;
	openMenuOffset: number;
	menuPosition: SideMenuPosition;
	menuStyle?: ViewStyle;

	onChange: OnChangeCallback;
	disableGestures: boolean;
}

interface UseStylesProps {
	overlayColor: string;
	isLeftMenu: boolean;
	isVerticalMenu: boolean;
	menuSize: number;
	menuOpenFraction: Animated.AnimatedInterpolation<number>;
}

const useStyles = ({ overlayColor, isLeftMenu, isVerticalMenu, menuSize, menuOpenFraction }: UseStylesProps) => {
	const { height: windowHeight, width: windowWidth } = useWindowDimensions();
	return useMemo(() => {
		const contentTranslateX = !isVerticalMenu ? menuOpenFraction.interpolate({
			inputRange: [0, 1],
			outputRange: [0, isLeftMenu ? menuSize : -menuSize],
		}) : 0;
		const menuTranslateY = isVerticalMenu ? menuOpenFraction.interpolate({
			inputRange: [0, 1],
			outputRange: [menuSize, 0],
			extrapolate: 'clamp',
		}) : 0;

		return StyleSheet.create({
			mainContainer: {
				display: 'flex',
				alignContent: 'stretch',
				height: windowHeight,
				flexGrow: 1,
				flexShrink: 1,
			},
			contentOuterWrapper: {
				flexGrow: 1,
				flexShrink: 1,
				width: windowWidth,
				height: windowHeight,
				transform: [
					{ translateX: contentTranslateX },
					// The RN Animation docs suggests setting "perspective" while setting other transform styles:
					// https://reactnative.dev/docs/animations#bear-in-mind
					{ perspective: 1000 },
				],
			},
			contentWrapper: {
				display: 'flex',
				flexDirection: 'column',
				flexGrow: 1,
				flexShrink: 1,
			},
			menuWrapper: {
				position: 'absolute',
				bottom: 0,
				...(isVerticalMenu ? {
					left: 0,
					right: 0,
					transform: [
						{ translateY: menuTranslateY },
						{ perspective: 1000 },
					],
				} : {
					top: 0,
					width: menuSize,
				}),
				overflow: 'hidden',

				// In React Native, RTL replaces `left` with `right` and `right` with `left`.
				// As such, we need to reverse the normal direction in RTL mode.
				...(isLeftMenu === !I18nManager.isRTL ? {
					left: 0,
				} : {
					right: 0,
				}),
			},
			menuContent: {
				flex: 1,
				width: isVerticalMenu ? undefined : menuSize,
				height: isVerticalMenu ? menuSize : undefined,
				alignSelf: isVerticalMenu ? 'stretch' : (isLeftMenu === !I18nManager.isRTL ? 'flex-end' : 'flex-start'),
			},
			closeButtonOverlay: {
				position: 'absolute',
				left: 0,
				right: 0,
				top: 0,
				bottom: 0,

				zIndex: 1,

				opacity: menuOpenFraction.interpolate({
					inputRange: [0, 1],
					outputRange: [0, 0.1],
					extrapolate: 'clamp',
				}),
				backgroundColor: overlayColor,
				display: 'flex',
				alignContent: 'stretch',
			},
			overlayContent: {
				height: windowHeight,
				width: windowWidth,
			},
		});
	}, [overlayColor, isLeftMenu, isVerticalMenu, windowWidth, windowHeight, menuSize, menuOpenFraction]);
};

interface UseAnimationsProps {
	menuSize: number;
	isLeftMenu: boolean;
	open: boolean;
}

const useAnimations = ({ menuSize, isLeftMenu, open }: UseAnimationsProps) => {
	const [animating, setIsAnimating] = useState(false);
	const menuDragOffset = useMemo(() => new Animated.Value(0), []);
	const basePositioningFraction = useMemo(() => new Animated.Value(0), []);
	const maximumDragOffsetValue = useMemo(() => new Animated.Value(1), []);

	// Update the value in a useEffect to prevent delays in applying the animation caused by
	// re-renders.
	useEffect(() => {
		// In a right-side menu, the drag offset increases while the menu is closing.
		// It needs to be inverted in that case:
		// || 1: Prevents division by zero
		maximumDragOffsetValue.setValue((menuSize || 1) * (isLeftMenu ? 1 : -1));
	}, [menuSize, isLeftMenu, maximumDragOffsetValue]);

	const menuOpenFraction = useMemo(() => {
		const animatedDragFraction = Animated.divide(menuDragOffset, maximumDragOffsetValue);

		return Animated.add(basePositioningFraction, animatedDragFraction);
	}, [menuDragOffset, basePositioningFraction, maximumDragOffsetValue]);

	const reduceMotionEnabled = useReduceMotionEnabled();
	const reduceMotionEnabledRef = useRef(false);
	reduceMotionEnabledRef.current = reduceMotionEnabled;

	const updateMenuPosition = useCallback(() => {
		const baseAnimationProps = {
			easing: Easing.elastic(0.5),
			duration: reduceMotionEnabledRef.current ? 0 : 200,
			useNativeDriver: true,
		};
		setIsAnimating(true);

		const animation = Animated.parallel([
			Animated.timing(basePositioningFraction, { toValue: open ? 1 : 0, ...baseAnimationProps }),
			Animated.timing(menuDragOffset, { toValue: 0, ...baseAnimationProps }),
		]);
		animation.start((result) => {
			if (result.finished) {
				setIsAnimating(false);
			}
		});
	}, [open, menuDragOffset, basePositioningFraction]);
	useEffect(() => {
		updateMenuPosition();
	}, [updateMenuPosition]);

	return { setIsAnimating, animating, updateMenuPosition, menuOpenFraction, menuDragOffset };
};

interface UsePanResponderProps {
	contentSize: number;
	disableGestures: boolean;
	isBottomMenu: boolean;
	isLeftMenu: boolean;
	isRightMenu: boolean;
	isVerticalMenu: boolean;
	menuDragOffset: Animated.Value;
	menuSize: number;
	open: boolean;
	setIsAnimating: React.Dispatch<React.SetStateAction<boolean>>;
	setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
	updateMenuPosition: ()=> void;
}

const usePanResponder = ({
	contentSize,
	disableGestures,
	isBottomMenu,
	isLeftMenu,
	isRightMenu,
	isVerticalMenu,
	menuDragOffset,
	menuSize,
	open,
	setIsAnimating,
	setIsOpen,
	updateMenuPosition,
}: UsePanResponderProps) => {
	return useMemo(() => {
		const toleranceX = 4;
		const toleranceY = 20;
		const edgeHitWidth = 20;

		return PanResponder.create({
			onMoveShouldSetPanResponderCapture: (_event, gestureState) => {
				if (disableGestures) {
					return false;
				}

				let startX;
				let dx;
				const dy = isVerticalMenu ? gestureState.dx : gestureState.dy;

				// Untransformed start position of the gesture -- moveX is the current position of
				// the pointer. Subtracting dx gives us the original start position.
				const gestureStartScreenX = gestureState.moveX - gestureState.dx;
				const gestureStartScreenY = gestureState.moveY - gestureState.dy;

				// Transform x, dx such that they are relative to the target screen edge -- this simplifies later
				// math.
				if (isLeftMenu) {
					startX = gestureStartScreenX;
					dx = gestureState.dx;
				} else if (isRightMenu) {
					startX = contentSize - gestureStartScreenX;
					dx = -gestureState.dx;
				} else if (isBottomMenu) {
					startX = contentSize - gestureStartScreenY;
					dx = -gestureState.dy;
				}

				const motionWithinToleranceY = Math.abs(dy) <= toleranceY;
				let startWithinTolerance, motionWithinToleranceX;
				if (open) {
					startWithinTolerance = startX >= menuSize - edgeHitWidth;
					motionWithinToleranceX = dx <= -toleranceX;
				} else {
					startWithinTolerance = startX <= edgeHitWidth;
					motionWithinToleranceX = dx >= toleranceX;
				}

				return startWithinTolerance && motionWithinToleranceX && motionWithinToleranceY;
			},
			onPanResponderGrant: () => {
				setIsAnimating(true);
			},
			onPanResponderMove: Animated.event([
				null,
				// Updates menuDragOffset with the .dx property of the second argument:
				isVerticalMenu ? { dy: menuDragOffset } : { dx: menuDragOffset },
			], { useNativeDriver: false }),
			onPanResponderEnd: (_event, gestureState) => {
				const isRightSwipe = gestureState.dx > 0;
				const isUpSwipe = gestureState.dy < 0;
				const newOpen = (
					isRightMenu && !isRightSwipe ||
					isLeftMenu && isRightSwipe ||
					isBottomMenu && isUpSwipe
				);
				if (newOpen === open) {
					updateMenuPosition();
				} else {
					setIsOpen(newOpen);
				}
			},
		});
	}, [isLeftMenu, isBottomMenu, isRightMenu, isVerticalMenu, menuDragOffset, menuSize, contentSize, open, setIsOpen, disableGestures, updateMenuPosition, setIsAnimating]);
};

const SideMenu: React.FC<Props> = props => {
	const [open, setIsOpen] = useState(false);

	useEffect(() => {
		setIsOpen(props.isOpen);
	}, [props.isOpen]);

	// menuSize: The size of the menu along the drag axis. In left/right mode, this is the width.
	const [menuSize, setMenuSize] = useState(0);
	const [contentSize, setContentSize] = useState(0);

	// In right-to-left layout, swap left and right to be consistent with other parts of
	// the app's layout.
	const isLeftMenu = props.menuPosition === (I18nManager.isRTL ? SideMenuPosition.Right : SideMenuPosition.Left);
	const isBottomMenu = props.menuPosition === SideMenuPosition.Bottom;
	const isRightMenu = !isLeftMenu && !isBottomMenu;
	const isVerticalMenu = isBottomMenu;

	const onLayoutChange = useCallback((e: LayoutChangeEvent) => {
		const { width, height } = e.nativeEvent.layout;
		const { width: windowWidth, height: windowHeight } = Dimensions.get('window');

		// Get the size along the drag axis
		const newContentSize = isVerticalMenu ? height : width;
		const windowSize = isVerticalMenu ? windowHeight : windowWidth;

		const openMenuOffsetPercentage = props.openMenuOffset / windowSize;
		const newMenuSize = Math.floor(newContentSize * openMenuOffsetPercentage);

		setContentSize(newContentSize);
		setMenuSize(newMenuSize);
	}, [props.openMenuOffset, isVerticalMenu]);

	const { animating, setIsAnimating, menuDragOffset, updateMenuPosition, menuOpenFraction } = useAnimations({
		isLeftMenu, menuSize, open,
	});

	const panResponder = usePanResponder({
		contentSize,
		disableGestures: props.disableGestures,
		isBottomMenu,
		isLeftMenu,
		isRightMenu,
		isVerticalMenu,
		menuDragOffset,
		menuSize,
		open,
		setIsAnimating,
		setIsOpen,
		updateMenuPosition,
	});
	const onChangeRef = useRef(props.onChange);
	onChangeRef.current = props.onChange;
	useEffect(() => {
		onChangeRef.current(open);

		AccessibilityInfo.announceForAccessibility(
			open ? _('Side menu opened') : _('Side menu closed'),
		);
	}, [open]);

	const onCloseButtonPress = useCallback(() => {
		setIsOpen(false);
		// Set isAnimating as soon as possible to avoid components disappearing, then reappearing.
		setIsAnimating(true);
	}, [setIsAnimating]);

	const styles = useStyles({ overlayColor: props.overlayColor, menuOpenFraction, menuSize, isLeftMenu, isVerticalMenu });

	const menuComponent = (
		<Animated.View style={[styles.menuWrapper, props.menuStyle]}>
			<AccessibleView
				inert={!open}
				style={styles.menuContent}
				testID='menu-inner-wrapper'
			>
				<AccessibleView
					// Auto-focuses an empty view at the beginning of the sidemenu -- if we instead
					// focus the container view, VoiceOver fails to focus to any components within
					// the sidebar.
					refocusCounter={open ? 1 : undefined}
				/>

				{props.menu}
			</AccessibleView>
		</Animated.View>
	);

	const contentComponent = (
		<AccessibleView
			inert={open}
			style={styles.contentWrapper}
		>
			<AccessibleView refocusCounter={!open ? 1 : undefined} />
			{props.children}
		</AccessibleView>
	);
	const closeButtonOverlay = (open || animating) ? (
		<Animated.View
			style={styles.closeButtonOverlay}
		>
			<Pressable
				aria-label={_('Close side menu')}
				role='button'
				onPress={onCloseButtonPress}
				style={styles.overlayContent}
			></Pressable>
		</Animated.View>
	) : null;

	const contentAndCloseButton = <Animated.View style={styles.contentOuterWrapper} testID='menu-content-wrapper'>
		{contentComponent}
		{closeButtonOverlay}
	</Animated.View>;

	return (
		<View
			onLayout={onLayoutChange}
			style={styles.mainContainer}
			{...panResponder.panHandlers}
			testID='menu-container'
		>
			{
				// In vertical mode, the menu overlays the content and is thus
				// drawn second
				isVerticalMenu ? [
					contentAndCloseButton, menuComponent,
				] : [
					menuComponent, contentAndCloseButton,
				]
			}
		</View>
	);
};

export default SideMenu;
