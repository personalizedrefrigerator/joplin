import * as React from 'react';
import { connect } from 'react-redux';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, NativeScrollEvent, NativeSyntheticEvent, PanResponder, StyleSheet, useWindowDimensions, View, ViewStyle } from 'react-native';
import useSafeAreaPadding from '../utils/hooks/useSafeAreaPadding';
import { themeStyle, ThemeStyle } from './global-style';
import Modal from './Modal';
import { AppState } from '../utils/types';
import useReduceMotionEnabled from '../utils/hooks/useReduceMotionEnabled';
import { TouchableRipple } from 'react-native-paper';
import { Second } from '@joplin/utils/time';

interface Props {
	themeId: number;
	style: ViewStyle;
	children: React.ReactNode;
	visible: boolean;
	draggable: boolean;
	onDismiss: ()=> void;
	onShow: ()=> void;
}

const useStyles = (theme: ThemeStyle, dragging: boolean) => {
	const { width: windowWidth } = useWindowDimensions();
	const safeAreaPadding = useSafeAreaPadding();

	return useMemo(() => {
		const isSmallWidthScreen = windowWidth < 500;
		const menuGapLeft = safeAreaPadding.paddingLeft + 6;
		const menuGapRight = safeAreaPadding.paddingRight + 6;

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
				paddingBottom: 0,

				backgroundColor: theme.backgroundColor,
				borderRadius: 16,
				borderBottomRightRadius: 0,
				borderBottomLeftRadius: 0,
				maxWidth: Math.min(400, windowWidth - menuGapRight - menuGapLeft),

				// Web: Prevents a scrollbar from being shown when dragging the menu
				// below the bottom of the screen.
				overflow: 'hidden',
			},
			contentContainer: {
				padding: 20,
				paddingBottom: 14 + safeAreaPadding.paddingBottom,
				gap: 8,
				flexDirection: 'row',
				flexWrap: 'wrap',
				flexShrink: 1,
				flexGrow: 1,
				userSelect: dragging ? 'none' : 'auto',
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
				height: 12,
			},
		});
	}, [theme, safeAreaPadding, windowWidth, dragging]);
};

const BottomDrawer: React.FC<Props> = props => {
	const theme = themeStyle(props.themeId);
	const [dragging, setDragging] = useState(false);
	const styles = useStyles(theme, dragging);

	const onContainerScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
		const offsetY = event.nativeEvent.contentOffset.y;
		if (offsetY < -50) {
			props.onDismiss();
		}
	}, [props.onDismiss]);

	const menuDragOffset = useMemo(() => new Animated.Value(0), []);
	const menuYOffset = useMemo(() => Animated.multiply(menuDragOffset, new Animated.Value(-1)), [menuDragOffset]);

	const reduceMotionEnabled = useReduceMotionEnabled();
	const reduceMotionEnabledRef = useRef(false);
	reduceMotionEnabledRef.current = reduceMotionEnabled;

	const dragToOffset = useCallback((offset: number) => {
		const baseAnimationProps = {
			easing: Easing.elastic(0.5),
			duration: reduceMotionEnabledRef.current ? 0 : 200,
			useNativeDriver: true,
		};

		const animation = Animated.timing(menuDragOffset, { toValue: offset, ...baseAnimationProps });
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
		<Animated.View style={[styles.contentContainer, props.style, { marginBottom: menuYOffset }]} ref={containerRef}>
			{props.draggable &&
				<DragHandle
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
		<TouchableRipple
			style={{ marginLeft: 'auto', marginRight: 'auto', backgroundColor: 'red', width: '60%', height: 8, borderRadius: 8 }}
			onPress={onPress}
		><View/></TouchableRipple>
	</View>;
};

