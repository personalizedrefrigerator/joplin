import * as React from 'react';
import { Mat33, Vec2 } from '@js-draw/math';
import { useCallback, useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import DragPoint from './DragPoint';

interface Props {
	imageSize: Vec2;
	screenToClipSpace: Mat33;
	clipSpaceToImage: Mat33;
}

const ResizeOverlay: React.FC<Props> = ({ clipSpaceToImage, screenToClipSpace }) => {
	const [ _overlaySize, setOverlaySize ] = useState(Vec2.zero);
	const onLayout = useCallback((event: LayoutChangeEvent) => {
		setOverlaySize(Vec2.of(
			event.nativeEvent.layout.width,
			event.nativeEvent.layout.height,
		));
	}, []);

	const dragPointPositions = useMemo(() => {
		const toScreen = screenToClipSpace
			.rightMul(clipSpaceToImage)
		const points: Vec2[] = [];
		for (let x = -1; x <= 1; x += 2) {
			for (let y = -1; y <= 1; y += 2) {
				points.push(
					toScreen.transformVec2(Vec2.of(x, y)).times(1)
				);
			}
		}
		return points;
	}, [clipSpaceToImage]);

	const dragPoints = [];
	let i = 0;
	for (const point of dragPointPositions) {
		dragPoints.push(
			<DragPoint
				key={`drag-point-${i++}`}
				position={point}
				onMove={(_, v) => console.log(`${point} to ${v}`)}
			/>
		);
	}

	return <View
		style={StyleSheet.absoluteFill}
		onLayout={onLayout}
	>
		{...dragPoints}
	</View>;
};

export default ResizeOverlay;
