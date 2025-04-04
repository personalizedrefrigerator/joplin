import * as React from 'react';
import { DragEventHandler, MouseEventHandler, useCallback, useMemo, useRef } from 'react';
import { ItemClickListener, ItemDragListener, ListItem, ListItemType } from '../types';
import TagItem, { TagLinkClickEvent } from '../listItemComponents/TagItem';
import { Dispatch } from 'redux';
import { clipboard } from 'electron';
import { getTrashFolderId } from '@joplin/lib/services/trash';
import BaseModel, { ModelType } from '@joplin/lib/BaseModel';
import Tag from '@joplin/lib/models/Tag';
import { _ } from '@joplin/lib/locale';
import { substrWithEllipsis } from '@joplin/lib/string-utils';
import { AppState } from '../../../app.reducer';
import { store } from '@joplin/lib/reducer';
import Folder from '@joplin/lib/models/Folder';
import bridge from '../../../services/bridge';
import MenuUtils from '@joplin/lib/services/commands/MenuUtils';
import CommandService from '@joplin/lib/services/CommandService';
import { FolderEntity } from '@joplin/lib/services/database/types';
import InteropService from '@joplin/lib/services/interop/InteropService';
import InteropServiceHelper from '../../../InteropServiceHelper';
import stateToWhenClauseContext from '@joplin/lib/services/commands/stateToWhenClauseContext';
import Setting from '@joplin/lib/models/Setting';
import PerFolderSortOrderService from '../../../services/sortOrder/PerFolderSortOrderService';
import { getFolderCallbackUrl, getTagCallbackUrl } from '@joplin/lib/callbackUrlUtils';
import { PluginStates, utils as pluginUtils } from '@joplin/lib/services/plugins/reducer';
import { MenuItemLocation } from '@joplin/lib/services/plugins/api/types';
import FolderItem from '../listItemComponents/FolderItem';
import Logger from '@joplin/utils/Logger';
import onFolderDrop from '@joplin/lib/models/utils/onFolderDrop';
import HeaderItem from '../listItemComponents/HeaderItem';
import AllNotesItem from '../listItemComponents/AllNotesItem';
import ListItemWrapper from '../listItemComponents/ListItemWrapper';
import { focus } from '@joplin/lib/utils/focusHandler';
import shim from '@joplin/lib/shim';

const Menu = bridge().Menu;
const MenuItem = bridge().MenuItem;

const logger = Logger.create('useOnRenderItem');

interface Props {
	dispatch: Dispatch;
	themeId: number;
	plugins: PluginStates;
	folders: FolderEntity[];
	collapsedFolderIds: string[];
	containerRef: React.RefObject<HTMLDivElement>;

	selectedIndex: number;
	listItems: ListItem[];
}

type ItemContextMenuListener = MouseEventHandler<HTMLElement>;

const menuUtils = new MenuUtils(CommandService.instance());

const focusListItem = (item: HTMLElement|null) => {
	if (item) {
		// Avoid scrolling to the selected item when refocusing the note list. Such a refocus
		// can happen if the note list rerenders and the selection is scrolled out of view and
		// can cause scroll to change unexpectedly.
		focus('useOnRenderItem', item, { preventScroll: true });
	}
};

const noFocusListItem = () => {};

const useOnRenderItem = (props: Props) => {

	const pluginsRef = useRef<PluginStates>(null);
	pluginsRef.current = props.plugins;
	const foldersRef = useRef<FolderEntity[]>(null);
	foldersRef.current = props.folders;

	const tagItem_click = useCallback(({ tag }: TagLinkClickEvent) => {
		props.dispatch({
			type: 'TAG_SELECT',
			id: tag ? tag.id : null,
		});
	}, [props.dispatch]);

	const onTagDrop_: DragEventHandler<HTMLElement> = useCallback(async event => {
		const tagId = event.currentTarget.getAttribute('data-tag-id');
		const dt = event.dataTransfer;
		if (!dt) return;

		if (dt.types.indexOf('text/x-jop-note-ids') >= 0) {
			event.preventDefault();

			const noteIds = JSON.parse(dt.getData('text/x-jop-note-ids'));
			for (let i = 0; i < noteIds.length; i++) {
				await Tag.addNote(tagId, noteIds[i]);
			}
		}
	}, []);

	const onItemContextMenu: ItemContextMenuListener = useCallback(async event => {
		const itemId = event.currentTarget.getAttribute('data-id');
		if (itemId === Folder.conflictFolderId()) return;

		const itemType = Number(event.currentTarget.getAttribute('data-type'));
		if (!itemId || !itemType) throw new Error('No data on element');

		const state: AppState = store().getState();

		let deleteMessage = '';
		const deleteButtonLabel = _('Remove');

		if (itemType === BaseModel.TYPE_TAG) {
			const tag = await Tag.load(itemId);
			deleteMessage = _('Remove tag "%s" from all notes?', substrWithEllipsis(tag.title, 0, 32));
		} else if (itemType === BaseModel.TYPE_SEARCH) {
			deleteMessage = _('Remove this search from the sidebar?');
		}

		const menu = new Menu();

		if (itemId === getTrashFolderId()) {
			menu.append(
				new MenuItem(menuUtils.commandToStatefulMenuItem('emptyTrash')),
			);
			menu.popup({ window: bridge().activeWindow() });
			return;
		}

		let item = null;
		if (itemType === BaseModel.TYPE_FOLDER) {
			item = BaseModel.byId(foldersRef.current, itemId);
		}

		const isDeleted = item ? !!item.deleted_time : false;

		if (!isDeleted) {
			if (itemType === BaseModel.TYPE_FOLDER && !item.encryption_applied) {
				menu.append(
					new MenuItem(menuUtils.commandToStatefulMenuItem('newFolder', itemId)),
				);
			}

			if (itemType === BaseModel.TYPE_FOLDER) {
				menu.append(
					new MenuItem(menuUtils.commandToStatefulMenuItem('deleteFolder', itemId)),
				);
			} else {
				menu.append(
					new MenuItem({
						label: deleteButtonLabel,
						click: async () => {
							const ok = bridge().showConfirmMessageBox(deleteMessage, {
								buttons: [deleteButtonLabel, _('Cancel')],
								defaultId: 1,
							});
							if (!ok) return;

							if (itemType === BaseModel.TYPE_TAG) {
								await Tag.untagAll(itemId);
							} else if (itemType === BaseModel.TYPE_SEARCH) {
								props.dispatch({
									type: 'SEARCH_DELETE',
									id: itemId,
								});
							}
						},
					}),
				);
			}

			if (itemType === BaseModel.TYPE_FOLDER && !item.encryption_applied) {
				menu.append(new MenuItem({
					...menuUtils.commandToStatefulMenuItem('moveToFolder', [itemId]),
					// By default, enabled is based on the selected folder. However, the right-click
					// menu can be shown for unselected folders.
					enabled: true,
				}));

				menu.append(new MenuItem(menuUtils.commandToStatefulMenuItem('openFolderDialog', { folderId: itemId })));

				menu.append(new MenuItem({ type: 'separator' }));

				const exportMenu = new Menu();
				const ioService = InteropService.instance();
				const ioModules = ioService.modules();
				for (let i = 0; i < ioModules.length; i++) {
					const module = ioModules[i];
					if (module.type !== 'exporter') continue;

					exportMenu.append(
						new MenuItem({
							label: module.fullLabel(),
							click: async () => {
								await InteropServiceHelper.export(props.dispatch, module, { sourceFolderIds: [itemId], plugins: pluginsRef.current });
							},
						}),
					);
				}

				// We don't display the "Share notebook" menu item for sub-notebooks
				// that are within a shared notebook. If user wants to do this,
				// they'd have to move the notebook out of the shared notebook
				// first.
				const whenClause = stateToWhenClauseContext(state, { commandFolderId: itemId });

				if (CommandService.instance().isEnabled('showShareFolderDialog', whenClause)) {
					menu.append(new MenuItem(menuUtils.commandToStatefulMenuItem('showShareFolderDialog', itemId)));
				}

				if (CommandService.instance().isEnabled('leaveSharedFolder', whenClause)) {
					menu.append(new MenuItem(menuUtils.commandToStatefulMenuItem('leaveSharedFolder', itemId)));
				}

				menu.append(
					new MenuItem({
						label: _('Export'),
						submenu: exportMenu,
					}),
				);
				if (Setting.value('notes.perFolderSortOrderEnabled')) {
					menu.append(new MenuItem({
						...menuUtils.commandToStatefulMenuItem('togglePerFolderSortOrder', itemId),
						type: 'checkbox',
						checked: PerFolderSortOrderService.isSet(itemId),
					}));
				}
			}

			if (itemType === BaseModel.TYPE_FOLDER) {
				menu.append(
					new MenuItem({
						label: _('Copy external link'),
						click: () => {
							clipboard.writeText(getFolderCallbackUrl(itemId));
						},
					}),
				);
			}

			if (itemType === BaseModel.TYPE_TAG) {
				menu.append(new MenuItem(
					menuUtils.commandToStatefulMenuItem('renameTag', itemId),
				));
				menu.append(
					new MenuItem({
						label: _('Copy external link'),
						click: () => {
							clipboard.writeText(getTagCallbackUrl(itemId));
						},
					}),
				);
			}

			const pluginViews = pluginUtils.viewsByType(pluginsRef.current, 'menuItem');

			for (const view of pluginViews) {
				const location = view.location;

				if (itemType === ModelType.Tag && location === MenuItemLocation.TagContextMenu ||
					itemType === ModelType.Folder && location === MenuItemLocation.FolderContextMenu
				) {
					menu.append(
						new MenuItem(menuUtils.commandToStatefulMenuItem(view.commandName, itemId)),
					);
				}
			}
		} else {
			if (itemType === BaseModel.TYPE_FOLDER) {
				menu.append(
					new MenuItem(menuUtils.commandToStatefulMenuItem('restoreFolder', itemId)),
				);
			}
		}

		menu.popup({ window: bridge().activeWindow() });
	}, [props.dispatch, pluginsRef]);



	const onFolderDragStart_: ItemDragListener = useCallback(event => {
		const folderId = event.currentTarget.getAttribute('data-folder-id');
		if (!folderId) return;

		event.dataTransfer.setDragImage(new Image(), 1, 1);
		event.dataTransfer.clearData();
		event.dataTransfer.setData('text/x-jop-folder-ids', JSON.stringify([folderId]));
	}, []);

	const onFolderDragOver_: ItemDragListener = useCallback(event => {
		if (event.dataTransfer.types.indexOf('text/x-jop-note-ids') >= 0) event.preventDefault();
		if (event.dataTransfer.types.indexOf('text/x-jop-folder-ids') >= 0) event.preventDefault();
	}, []);

	const onFolderDrop_: ItemDragListener = useCallback(async event => {
		const folderId = event.currentTarget.getAttribute('data-folder-id');
		const dt = event.dataTransfer;
		if (!dt) return;

		// folderId can be NULL when dropping on the sidebar Notebook header. In that case, it's used
		// to put the dropped folder at the root. But for notes, folderId needs to always be defined
		// since there's no such thing as a root note.

		try {
			if (dt.types.indexOf('text/x-jop-note-ids') >= 0) {
				event.preventDefault();
				if (!folderId) return;
				const noteIds = JSON.parse(dt.getData('text/x-jop-note-ids'));
				await onFolderDrop(noteIds, [], folderId);
			} else if (dt.types.indexOf('text/x-jop-folder-ids') >= 0) {
				event.preventDefault();
				const folderIds = JSON.parse(dt.getData('text/x-jop-folder-ids'));
				await onFolderDrop([], folderIds, folderId);
			}
		} catch (error) {
			logger.error(error);
			await shim.showErrorDialog(error.message);
		}
	}, []);

	const onFolderToggleClick_: ItemClickListener = useCallback(event => {
		const folderId = event.currentTarget.getAttribute('data-folder-id');

		props.dispatch({
			type: 'FOLDER_TOGGLE',
			id: folderId,
		});
	}, [props.dispatch]);

	const folderItem_click = useCallback((folderId: string) => {
		props.dispatch({
			type: 'FOLDER_SELECT',
			id: folderId ? folderId : null,
		});
	}, [props.dispatch]);

	// If at least one of the folder has an icon, then we display icons for all
	// folders (those without one will get the default icon). This is so that
	// visual alignment is correct for all folders, otherwise the folder tree
	// looks messy.
	const showFolderIcons = useMemo(() => {
		return Folder.shouldShowFolderIcons(props.folders);
	}, [props.folders]);

	const selectedIndexRef = useRef(props.selectedIndex);
	selectedIndexRef.current = props.selectedIndex;

	const itemCount = props.listItems.length;
	return useCallback((item: ListItem, index: number) => {
		const selected = props.selectedIndex === index;
		const focusInList = document.hasFocus() && props.containerRef.current?.contains(document.activeElement);
		const anchorRef = (focusInList && selected) ? focusListItem : noFocusListItem;

		if (item.kind === ListItemType.Tag) {
			const tag = item.tag;
			return <TagItem
				key={item.key}
				anchorRef={anchorRef}
				selected={selected}
				onClick={tagItem_click}
				onTagDrop={onTagDrop_}
				onContextMenu={onItemContextMenu}
				tag={tag}
				itemCount={itemCount}
				index={index}
			/>;
		} else if (item.kind === ListItemType.Folder) {
			const folder = item.folder;
			const isExpanded = props.collapsedFolderIds.indexOf(folder.id) < 0;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
			let noteCount = (folder as any).note_count;

			// For now hide the count for folders in the trash because it doesn't work and getting it to
			// work would be tricky.
			if (folder.deleted_time || folder.id === getTrashFolderId()) noteCount = 0;

			// Thunderbird count: Subtract children note_count from parent folder if it expanded.
			if (isExpanded) {
				for (let i = 0; i < props.folders.length; i++) {
					if (props.folders[i].parent_id === folder.id) {
						// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
						noteCount -= (props.folders[i] as any).note_count;
					}
				}
			}
			return <FolderItem
				key={item.key}
				anchorRef={anchorRef}
				selected={selected}
				folderId={folder.id}
				folderTitle={Folder.displayTitle(folder)}
				folderIcon={Folder.unserializeIcon(folder.icon)}
				depth={item.depth}
				isExpanded={isExpanded}
				hasChildren={item.hasChildren}
				noteCount={noteCount}
				onFolderDragStart_={onFolderDragStart_}
				onFolderDragOver_={onFolderDragOver_}
				onFolderDrop_={onFolderDrop_}
				itemContextMenu={onItemContextMenu}
				folderItem_click={folderItem_click}
				onFolderToggleClick_={onFolderToggleClick_}
				shareId={folder.share_id}
				parentId={folder.parent_id}
				showFolderIcon={showFolderIcons}
				index={index}
				itemCount={itemCount}
			/>;
		} else if (item.kind === ListItemType.Header) {
			return <HeaderItem
				key={item.id}
				anchorRef={anchorRef}
				item={item}
				isSelected={selected}
				onDrop={item.supportsFolderDrop ? onFolderDrop_ : null}
				index={index}
				itemCount={itemCount}
			/>;
		} else if (item.kind === ListItemType.AllNotes) {
			return <AllNotesItem
				key={item.key}
				anchorRef={anchorRef}
				selected={selected}
				item={item}
				index={index}
				itemCount={itemCount}
			/>;
		} else if (item.kind === ListItemType.Spacer) {
			return (
				<ListItemWrapper
					key={item.key}
					containerRef={anchorRef}
					depth={1}
					selected={selected}
					itemIndex={index}
					itemCount={itemCount}
					highlightOnHover={false}
					className='sidebar-spacer-item'
				>
					<div aria-label={_('Spacer')}></div>
				</ListItemWrapper>
			);
		} else {
			const exhaustivenessCheck: never = item;
			return exhaustivenessCheck;
		}
	}, [
		folderItem_click,
		onFolderDragOver_,
		onFolderDragStart_,
		onFolderDrop_,
		onFolderToggleClick_,
		onItemContextMenu,
		onTagDrop_,
		props.collapsedFolderIds,
		props.folders,
		showFolderIcons,
		tagItem_click,
		props.selectedIndex,
		props.containerRef,
		itemCount,
	]);
};

export default useOnRenderItem;
