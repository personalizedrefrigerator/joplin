import * as React from 'react';
import { useCallback } from 'react';
import { HeaderId, HeaderListItem } from '../types';
import bridge from '../../../services/bridge';
import MenuUtils from '@joplin/lib/services/commands/MenuUtils';
import CommandService from '@joplin/lib/services/CommandService';
import ListItemWrapper, { ItemSelectionState, ListItemRef } from './ListItemWrapper';

const Menu = bridge().Menu;
const MenuItem = bridge().MenuItem;
const menuUtils = new MenuUtils(CommandService.instance());


interface Props {
	anchorRef: ListItemRef;
	item: HeaderListItem;
	selectionState: ItemSelectionState;
	onDrop: React.DragEventHandler|null;
	index: number;
	itemCount: number;
}

const HeaderItem: React.FC<Props> = props => {
	const item = props.item;
	const onItemClick = item.onClick;
	const itemId = item.id;

	const onClick: React.MouseEventHandler<HTMLElement> = useCallback(event => {
		if (onItemClick) {
			onItemClick(itemId, event);
		}
	}, [onItemClick, itemId]);

	const onContextMenu = useCallback(async () => {
		if (itemId === HeaderId.FolderHeader) {
			const menu = new Menu();

			menu.append(
				new MenuItem(menuUtils.commandToStatefulMenuItem('newFolder')),
			);

			menu.popup({ window: bridge().activeWindow() });
		}
	}, [itemId]);

	return (
		<ListItemWrapper
			containerRef={props.anchorRef}
			selectionState={props.selectionState}
			itemIndex={props.index}
			itemCount={props.itemCount}
			expanded={props.item.expanded}
			onContextMenu={onContextMenu}
			depth={item.depth}
			highlightOnHover={false}
			className='sidebar-header-container'
			{...item.extraProps}
			onDrop={props.onDrop}
		>
			<div
				className='sidebar-header'
				onClick={onClick}
			>
				<i className={`sidebar-header-icon ${item.iconName}`} aria-hidden='true' role='img'/>
				<span className='sidebar-header-label'>{item.label}</span>
			</div>
		</ListItemWrapper>
	);
};

export default HeaderItem;
