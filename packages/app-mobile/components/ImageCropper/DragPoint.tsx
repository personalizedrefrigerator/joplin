import * as React from 'react';
import { useMemo, useRef } from 'react';
import { Vec2 } from '@js-draw/math';
import { StyleSheet, Animated, PanResponder, Pressable } from 'react-native';

interface Props {
	// The base (initial) position of the handle
	position: Vec2;
	onMove(basePositon: Vec2, offset: Vec2): void;
}

const DragPoint: React.FC<Props> = ({ position, onMove }) => {
	const onMoveRef = useRef(onMove);
	onMoveRef.current = onMove;
	const basePositionRef = useRef(position);
	basePositionRef.current = position;

	const pan = useMemo(() => {
		const value = new Animated.ValueXY();
		value.addListener(({x, y}) => {
			onMoveRef.current(position, Vec2.of(x, y));
		});
		return value;
	}, [onMove]);

	const panResponder = useMemo(() => {
		return PanResponder.create({
			onMoveShouldSetPanResponder: () => true,
			onMoveShouldSetPanResponderCapture: () => true,
			onPanResponderMove: Animated.event([
				null, // event
				{dx: pan.x, dy: pan.y}, // gestureState
			], { useNativeDriver: false }),
			onPanResponderRelease: () => {
				pan.extractOffset();
			},
		});
	}, [pan]);

	return <Animated.View
		style={{
			left: position.x,
			top: position.y,
			position: 'absolute',
			transform: [{
				translateX: pan.x,
			}, {
				translateY: pan.y,
			}]
		}}
		{...panResponder.panHandlers}
	>
		<Pressable style={styles.handle}/>
	</Animated.View>
};

const styles = StyleSheet.create({
	handle: {
		borderColor: 'black',
		borderWidth: 1,
		backgroundColor: 'white',
		borderRadius: 14,
		width: 32,
		height: 32,
	},
});

export default DragPoint;
