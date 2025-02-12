import * as React from 'react';
import { AccessibilityInfo, Animated, Easing, I18nManager, LayoutChangeEvent, LayoutRectangle, PanResponder, Pressable, StyleSheet, useWindowDimensions, View, ViewStyle } from 'react-native';
import { RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

	label: string;
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
		// For horizontal non-overlay menus
		const contentTranslateX = !isVerticalMenu ? menuOpenFraction.interpolate({
			inputRange: [0, 1],
			outputRange: [0, isLeftMenu ? menuSize : -menuSize],
		}) : 0;
		// For vertical overlay menus
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
			contentAndCloseButtonWrapper: {
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
				} : {
					top: 0,
					width: menuSize,
				}),

				// In React Native, RTL replaces `left` with `right` and `right` with `left`.
				// As such, we need to reverse the normal direction in RTL mode.
				...(isLeftMenu === !I18nManager.isRTL ? {
					left: 0,
				} : {
					right: 0,
				}),

				transform: [
					{ translateY: menuTranslateY },
					{ perspective: 1000 },
				],
			},
			menuContent: {
				flex: 1,
				width: isVerticalMenu ? undefined : menuSize,
				height: isVerticalMenu ? menuSize : undefined,
				flexBasis: menuSize,
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
	menuLayoutRef: RefObject<LayoutRectangle>;
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
	menuLayoutRef,
	open,
	setIsAnimating,
	setIsOpen,
	updateMenuPosition,
}: UsePanResponderProps) => {
	return useMemo(() => {
		const toleranceX = 4;
		const toleranceY = 20;
		const edgeHitWidth = 20;

		const pointIsInsideMenu = (x: number, y: number, padding: number) => {
			const menuLayout = menuLayoutRef.current;
			const centerX = menuLayout.x + menuLayout.width / 2;
			const centerY = menuLayout.y + menuLayout.height / 2;
			const distX = Math.abs(x - centerX);
			const distY = Math.abs(y - centerY);
			const insideMenuX = distX <= menuLayout.width / 2 + padding;
			const insideMenuY = distY <= menuLayout.height / 2 + padding;

			return insideMenuX && insideMenuY;
		};

		return PanResponder.create({
			onMoveShouldSetPanResponderCapture: (_event, gestureState) => {
				if (disableGestures) {
					return false;
				}

				// Untransformed start position of the gesture -- moveX is the current position of
				// the pointer. Subtracting dx gives us the original start position.
				const gestureStartScreenX = gestureState.moveX - gestureState.dx;
				const gestureStartScreenY = gestureState.moveY - gestureState.dy;

				if (pointIsInsideMenu(gestureStartScreenX, gestureStartScreenY, -edgeHitWidth)) {
					return false;
				}

				let startX;
				let dx;
				const dy = isVerticalMenu ? gestureState.dx : gestureState.dy;

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
					startWithinTolerance = true;
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
	}, [isLeftMenu, isBottomMenu, isRightMenu, isVerticalMenu, menuDragOffset, menuLayoutRef, contentSize, open, setIsOpen, disableGestures, updateMenuPosition, setIsAnimating]);
};

const useSizes = (isVerticalMenu: boolean, openMenuOffset: number) => {
	const [contentSize, setContentSize] = useState(0);

	const onContainerLayout = useCallback((e: LayoutChangeEvent) => {
		const { width, height } = e.nativeEvent.layout;
		// Get the size along the drag axis
		const newContentSize = isVerticalMenu ? height : width;
		setContentSize(newContentSize);
	}, [isVerticalMenu]);
	const { width: windowWidth, height: windowHeight } = useWindowDimensions();

	const menuSize = useMemo(() => {
		const windowSize = isVerticalMenu ? windowHeight : windowWidth;

		const maximumOffsetFraction = 1;
		const openMenuOffsetFraction = Math.min(openMenuOffset / windowSize, maximumOffsetFraction);
		return Math.floor(contentSize * openMenuOffsetFraction);
	}, [windowWidth, windowHeight, contentSize, openMenuOffset, isVerticalMenu]);

	// menuSize: The size of the menu along the drag axis. In left/right mode, this is the width.
	return { menuSize, onContainerLayout, contentSize };
};

const useOnChangeNotifier = (open: boolean, menuLabel: string, onChange: OnChangeCallback) => {
	const labelRef = useRef(menuLabel);
	labelRef.current = menuLabel;
	const onChangeRef = useRef(onChange);
	onChangeRef.current = onChange;

	const isFirstNotificationRef = useRef(true);

	useEffect(() => {
		onChangeRef.current(open);

		// Avoid announcing for accessibility when the sidemenu component first mounts
		// (especially if closed). Such notifications are distracting.
		if (!isFirstNotificationRef.current && !open) {
			AccessibilityInfo.announceForAccessibility(
				open ? _('%s opened', labelRef.current) : _('%s closed', labelRef.current),
			);
		}
		isFirstNotificationRef.current = false;
	}, [open]);
};

const SideMenu: React.FC<Props> = props => {
	const [open, setIsOpen] = useState(false);
	const hasBeenOpen = useRef(false);
	hasBeenOpen.current ||= open;

	useEffect(() => {
		setIsOpen(props.isOpen);
	}, [props.isOpen]);

	// In right-to-left layout, swap left and right to be consistent with other parts of
	// the app's layout.
	const isLeftMenu = props.menuPosition === (I18nManager.isRTL ? SideMenuPosition.Right : SideMenuPosition.Left);
	const isBottomMenu = props.menuPosition === SideMenuPosition.Bottom;
	const isRightMenu = !isLeftMenu && !isBottomMenu;
	const isVerticalMenu = isBottomMenu;

	const { menuSize, contentSize, onContainerLayout } = useSizes(isVerticalMenu, props.openMenuOffset);

	const { animating, setIsAnimating, menuDragOffset, updateMenuPosition, menuOpenFraction } = useAnimations({
		isLeftMenu, menuSize, open,
	});

	const menuLayoutRef = useRef<LayoutRectangle|null>();
	const onMenuLayout = useCallback((event: LayoutChangeEvent) => {
		menuLayoutRef.current = event.nativeEvent.layout;
	}, []);
	const panResponder = usePanResponder({
		contentSize,
		disableGestures: props.disableGestures,
		isBottomMenu,
		isLeftMenu,
		isRightMenu,
		isVerticalMenu,
		menuDragOffset,
		menuLayoutRef,
		open,
		setIsAnimating,
		setIsOpen,
		updateMenuPosition,
	});

	useOnChangeNotifier(open, props.label, props.onChange);
	const onCloseButtonPress = useCallback(() => {
		setIsOpen(false);
		// Set isAnimating as soon as possible to avoid components disappearing, then reappearing.
		setIsAnimating(true);
	}, [setIsAnimating]);

	const styles = useStyles({ overlayColor: props.overlayColor, menuOpenFraction, menuSize, isLeftMenu, isVerticalMenu });

	const menuComponent = (
		<Animated.View
			style={[styles.menuWrapper, props.menuStyle]}
			onLayout={onMenuLayout}
			key='menu'
		>
			<AccessibleView
				inert={!open}
				style={styles.menuContent}
				testID='menu-inner-wrapper'
			>
				{props.menu}
			</AccessibleView>
		</Animated.View>
	);

	const contentComponent = (
		<AccessibleView
			inert={open}
			style={styles.contentWrapper}
		>
			<AccessibleView
				refocusCounter={!open && hasBeenOpen.current ? 1 : undefined}
			/>
			{props.children}
		</AccessibleView>
	);
	const closeButtonOverlay = (open || animating) ? (
		<Animated.View
			style={styles.closeButtonOverlay}
		>
			<Pressable
				aria-label={_('Close %s', props.label)}
				role='button'
				onPress={onCloseButtonPress}
				style={styles.overlayContent}
			/>
		</Animated.View>
	) : null;

	const contentAndCloseButton = <Animated.View
		style={styles.contentAndCloseButtonWrapper}
		key='menu-content-wrapper'
	>
		{contentComponent}
		{closeButtonOverlay}
	</Animated.View>;

	return (
		<View
			onLayout={onContainerLayout}
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
