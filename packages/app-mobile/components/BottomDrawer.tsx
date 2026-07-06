import * as React from 'react';
import { connect } from 'react-redux';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, NativeScrollEvent, NativeSyntheticEvent, PanResponder, Platform, Pressable, StyleSheet, useWindowDimensions, View, ViewStyle } from 'react-native';
import useSafeAreaPadding from '../utils/hooks/useSafeAreaPadding';
import { themeStyle, ThemeStyle } from './global-style';
import Modal from './Modal';
import { AppState } from '../utils/types';
import useReduceMotionEnabled from '../utils/hooks/useReduceMotionEnabled';
import { Second } from '@joplin/utils/time';
import { _ } from '@joplin/lib/locale';

interface Props {
	themeId: number;
	style: ViewStyle;
	children: React.ReactNode;
	visible: boolean;
	draggable: boolean;
	onDismiss: ()=> void;
	onShow: ()=> void;
}

const useStyles = (theme: ThemeStyle, dragging: boolean, dragOffset: Animated.AnimatedInterpolation<number>) => {
	const { width: windowWidth, height: windowHeight } = useWindowDimensions();
	const safeAreaPadding = useSafeAreaPadding();

	return useMemo(() => {
		const isSmallWidthScreen = windowWidth < 500;
		const menuGapLeft = safeAreaPadding.paddingLeft + 6;
		const menuGapRight = safeAreaPadding.paddingRight + 6;

		// On web, any spaceBelowScreenEdge results in a scrollbar and extra scroll.
		const spaceBelowScreenEdge = Platform.OS === 'web' ? 0 : windowHeight;

		return StyleSheet.create({
			menuStyle: {
				alignSelf: 'flex-end',
				...(isSmallWidthScreen ? {
					// Center on small screens, rather than float right.
					alignSelf: 'center',
				} : {}),
				flexDirection: 'row',
				marginRight: menuGapRight,
				marginLeft: menuGapLeft,

				backgroundColor: theme.backgroundColor,
				borderRadius: 16,
				borderBottomRightRadius: 0,
				borderBottomLeftRadius: 0,
				maxWidth: Math.min(400, windowWidth - menuGapRight - menuGapLeft),

				marginBottom: -spaceBelowScreenEdge,

				userSelect: dragging ? 'none' : 'auto',
				transform: [
					{
						translateY: dragOffset.interpolate({
							inputRange: [-spaceBelowScreenEdge, 1],
							outputRange: [-spaceBelowScreenEdge, 1],
							// Avoid shifting the menu up when there's no extra space below the menu
							extrapolateLeft: 'clamp',
							extrapolateRight: 'extend',
						}),
					},
					{ perspective: 1000 },
				],
			},
			contentContainer: {
				padding: 20,
				paddingBottom: 14 + safeAreaPadding.paddingBottom,
				gap: 8,
				flexDirection: 'row',
				flexWrap: 'wrap',
				flexShrink: 1,
				flexGrow: 1,

				marginBottom: spaceBelowScreenEdge,
			},
			modalBackground: {
				paddingTop: 0,
				paddingLeft: 0,
				paddingRight: 0,
				paddingBottom: 0,
				justifyContent: 'flex-end',
				flexDirection: 'column',
			},
			dismissButton: {
				top: 0,
				bottom: undefined,
				height: theme.marginMedium,
			},
			dragHandle: {
				marginLeft: 'auto',
				marginRight: 'auto',
				backgroundColor: theme.dividerColor,
				width: '100%',
				maxWidth: 88,
				height: theme.marginSmall,
				borderRadius: theme.marginSmall,
			},
		});
	}, [theme, safeAreaPadding, windowWidth, dragging, dragOffset, windowHeight]);
};

const BottomDrawer: React.FC<Props> = props => {
	const theme = themeStyle(props.themeId);
	const [dragging, setDragging] = useState(false);

	const onContainerScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
		const offsetY = event.nativeEvent.contentOffset.y;
		if (offsetY < -80) {
			props.onDismiss();
		}
	}, [props.onDismiss]);

	const menuDragOffset = useMemo(() => new Animated.Value(0), []);
	const menuYOffset = useMemo(() => menuDragOffset, [menuDragOffset]);
	const styles = useStyles(theme, dragging, menuYOffset);

	const reduceMotionEnabled = useReduceMotionEnabled();
	const reduceMotionEnabledRef = useRef(false);
	reduceMotionEnabledRef.current = reduceMotionEnabled;

	const dragToOffset = useCallback((offset: number) => {
		const animation = Animated.timing(menuDragOffset, {
			toValue: offset,
			easing: Easing.elastic(0.5),
			duration: reduceMotionEnabledRef.current ? 0 : 200,
			useNativeDriver: true,
		});
		animation.start();
	}, [menuDragOffset]);

	const clearDragOffset = useCallback(() => {
		dragToOffset(0);
	}, [dragToOffset]);

	const containerRef = useRef<View|null>(null);
	useEffect(() => {
		if (props.visible) {
			clearDragOffset();
		} else {
			containerRef.current?.measure((_x, _y, _width, height) => {
				dragToOffset(height);
			});
		}
	}, [props.visible, clearDragOffset, dragToOffset]);

	const onDragEnd = useCallback((_dx: number, dy: number) => {
		if (dy > 50) {
			props.onDismiss();
		} else {
			clearDragOffset();
		}
	}, [clearDragOffset, props.onDismiss]);

	return <Modal
		visible={props.visible}
		onClose={props.onDismiss}
		onShow={props.onShow}
		backgroundColor={theme.backgroundColorTransparent2}
		modalBackgroundStyle={styles.modalBackground}
		dismissButtonStyle={styles.dismissButton}
		containerStyle={styles.menuStyle}
		scrollOverflow={{
			overScrollMode: 'always',
			onScroll: onContainerScroll,
		}}
	>
		<Animated.View style={[styles.contentContainer, props.style]} ref={containerRef}>
			{props.draggable &&
				<DragHandle
					style={styles.dragHandle}
					setDragging={setDragging}
					dragValue={menuDragOffset}
					onDragEnd={onDragEnd}
					onDismiss={props.onDismiss}
				/>}
			{props.children}
		</Animated.View>
	</Modal>;
};

export default connect((state: AppState) => {
	return {
		themeId: state.settings.theme,
	};
})(BottomDrawer);


interface DragHandleProps {
	style: ViewStyle;

	dragValue: Animated.Value;
	onDragEnd: (dx: number, dy: number)=> void;
	onDismiss: ()=> void;

	setDragging: (dragging: boolean)=> void;
}

const DragHandle: React.FC<DragHandleProps> = props => {
	const dragEndRef = useRef(0);

	const panResponder = useMemo(() => {
		return PanResponder.create({
			onMoveShouldSetPanResponderCapture: (_event, gestureState) => {
				return Math.abs(gestureState.dx) < 30;
			},
			onPanResponderGrant: () => {
				props.setDragging(true);
				dragEndRef.current = 0;
			},
			onPanResponderMove: Animated.event([
				null,
				// Updates menuDragOffset with the .dy property of the second argument:
				{ dy: props.dragValue },
			], { useNativeDriver: false, listener: event => event.preventDefault() }),
			onPanResponderEnd: (_event, gestureState) => {
				props.onDragEnd(gestureState.dx, gestureState.dy);
				props.setDragging(false);
				dragEndRef.current = performance.now();
			},
		});
	}, [props.dragValue, props.onDragEnd, props.setDragging]);

	const onPress = useCallback(() => {
		// Drags can also trigger onPress events:
		if (dragEndRef.current < performance.now() - Second * 0.1) {
			props.onDismiss();
		}
	}, [props.onDismiss]);


	return <View
		style={{ flexGrow: 1 }}
		{...panResponder.panHandlers}
	>
		<Pressable
			onPress={onPress}
			style={{ paddingTop: 16, marginTop: -16 }}
			aria-label={_('Dismiss')}
		>
			<View style={props.style}/>
		</Pressable>
	</View>;
};

