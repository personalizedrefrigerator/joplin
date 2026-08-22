import * as React from 'react';
import { useRef, useState, useEffect, useCallback } from 'react';
import useWindowResizeEvent from './utils/useWindowResizeEvent';
import setLayoutItemProps from './utils/setLayoutItemProps';
import useLayoutItemSizes, { EdgeFlags, LayoutItemSizes, itemSize, calculateMaxSizeAvailableForItem } from './utils/useLayoutItemSizes';
import validateLayout from './utils/validateLayout';
import { Size, LayoutItem } from './utils/types';
import { canMove, MoveDirection } from './utils/movements';
import { buildResizeSnapshot, computeEdges, isItemVisibleInRender, lastVisibleChildIndex, planResize, ResizeStartSnapshot } from './utils/resizeLogic';
import MoveButtons, { MoveButtonClickEvent } from './MoveButtons';
import type { ResizeCallback, ResizeStartCallback } from 're-resizable';
import { themeStyle } from '@joplin/lib/theme';
import { ThemeAppearance } from '@joplin/lib/themes/type';
import Dialog from '@joplin/lib/components/Dialog';
import EventEmitter = require('events');
import LayoutItemContainer from './LayoutItemContainer';

interface OnResizeEvent {
	layout: LayoutItem;
}

interface ResizedItem extends ResizeStartSnapshot {
	maxSize: Size;
}

export interface RenderItemEvent {
	eventEmitter: EventEmitter;
	visible: boolean;
	size: Size;
	item: LayoutItem;
}

interface Props {
	layout: LayoutItem;
	layoutKeyToLabel: (key: string)=> string;
	onResize(event: OnResizeEvent): void;
	width?: number;
	height?: number;
	renderItem: (key: string, event: RenderItemEvent)=> React.ReactNode;
	onMoveButtonClick(event: MoveButtonClickEvent): void;
	moveMode: boolean;
	moveModeMessage: string;
	themeId: number;
}

const itemVisible = isItemVisibleInRender;

function ResizableLayout(props: Props) {
	const eventEmitter = useRef(new EventEmitter());

	const [resizedItem, setResizedItem] = useState<ResizedItem|null>(null);
	const lastUsedMoveButtonKey = useRef<string|null>(null);

	const theme = themeStyle(props.themeId);
	const moveOverlayBackground = theme.appearance === ThemeAppearance.Light ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)';

	const onMoveButtonClick = useCallback((event: MoveButtonClickEvent) => {
		lastUsedMoveButtonKey.current = event.buttonKey;
		props.onMoveButtonClick(event);
	}, [props.onMoveButtonClick]);

	const renderMoveControls = (item: LayoutItem, parent: LayoutItem | null, size: Size) => {
		return (
			<div className='resizable-layout-item' key={item.key} style={{ width: size.width, height: size.height }}>
				<div className='move-overlay' style={{ '--move-overlay-background': moveOverlayBackground } as React.CSSProperties}>
					<MoveButtons
						autoFocusKey={lastUsedMoveButtonKey.current}
						itemKey={item.key}
						itemLabel={props.layoutKeyToLabel(item.key)}
						onClick={onMoveButtonClick}
						canMoveLeft={canMove(MoveDirection.Left, item, parent)}
						canMoveRight={canMove(MoveDirection.Right, item, parent)}
						canMoveUp={canMove(MoveDirection.Up, item, parent)}
						canMoveDown={canMove(MoveDirection.Down, item, parent)}
					/>
				</div>
			</div>
		);
	};

	function renderItemWrapper(comp: React.ReactNode, item: LayoutItem, size: Size) {
		return (
			<div className='resizable-layout-item' key={item.key} style={{ width: size.width, height: size.height }}>
				{comp}
			</div>
		);
	}

	function renderLayoutItem(
		item: LayoutItem, parent: LayoutItem | null, sizes: LayoutItemSizes, isVisible: boolean, isLastChild: boolean, onlyMoveControls: boolean, parentEdges: EdgeFlags = { ownRight: false, ownBottom: false, parentRight: false, parentBottom: false },
	): React.ReactNode {
		const edges = computeEdges(parent, isLastChild, parentEdges);

		const onResizeStart: ResizeStartCallback = () => {
			setResizedItem({
				...buildResizeSnapshot(item, parent, props.moveMode, sizes),
				maxSize: calculateMaxSizeAvailableForItem(item, parent, sizes),
			});
		};

		const onResize: ResizeCallback = (_event, direction, _refToElement, delta) => {
			let newLayout = props.layout;
			for (const update of planResize(resizedItem, direction, delta)) {
				newLayout = setLayoutItemProps(newLayout, update.key, update.props);
			}
			props.onResize({ layout: newLayout });
			eventEmitter.current.emit('resize');
		};

		const onResizeStop: ResizeCallback = (_event, _direction, _refToElement, delta) => {
			onResize(_event, _direction, _refToElement, delta);
			setResizedItem(null);
		};

		const resizedItemMaxSize = resizedItem && item.key === resizedItem.key ? resizedItem.maxSize : null;
		const visible = itemVisible(item, props.moveMode);
		const itemContainerProps = {
			key: item.key, item, parent, sizes, resizedItemMaxSize, onResizeStart, onResizeStop, onResize, isLastChild, visible, edges,
		};
		if (!item.children) {
			const size = itemSize(item, parent, sizes, false, edges);

			const comp = props.renderItem(item.key, {
				item: item,
				eventEmitter: eventEmitter.current,
				size: size,
				visible: isVisible,
			});

			const wrapper = onlyMoveControls ? renderMoveControls(item, parent, size) : renderItemWrapper(comp, item, size);
			return <LayoutItemContainer {...itemContainerProps}>
				{wrapper}
			</LayoutItemContainer>;
		} else {
			const lastVisibleIdx = lastVisibleChildIndex(item, props.moveMode);
			const childrenComponents = [];
			for (let i = 0; i < item.children.length; i++) {
				const child = item.children[i];
				childrenComponents.push(
					renderLayoutItem(child, item, sizes, isVisible && itemVisible(child, props.moveMode), i === lastVisibleIdx, onlyMoveControls, edges),
				);
			}

			return <LayoutItemContainer {...itemContainerProps}>
				{childrenComponents}
			</LayoutItemContainer>;
		}
	}

	useEffect(() => {
		validateLayout(props.layout);
	}, [props.layout]);

	useWindowResizeEvent(eventEmitter);
	const sizes = useLayoutItemSizes(props.layout, props.moveMode);

	const renderRoot = (moveControlsOnly: boolean) => {
		return renderLayoutItem(props.layout, null, sizes, itemVisible(props.layout, props.moveMode), true, moveControlsOnly);
	};

	function renderMoveModeBox() {
		return <div>
			<Dialog contentFillsScreen={true} className='change-app-layout-dialog'>
				<h1 className='move-mode-message'>{props.moveModeMessage}</h1>
				{renderRoot(true)}
			</Dialog>
			{renderRoot(false)}
		</div>;
	}

	if (props.moveMode) {
		return renderMoveModeBox();
	} else {
		return renderRoot(false);
	}
}

export default ResizableLayout;
