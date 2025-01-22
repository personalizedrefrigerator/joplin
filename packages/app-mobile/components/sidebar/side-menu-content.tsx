import * as React from 'react';
import { useMemo, useCallback, useContext } from 'react';
import { TouchableOpacity, Text, StyleSheet, ScrollView, View, Image, ImageStyle } from 'react-native';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';
const IonIcon = require('react-native-vector-icons/Ionicons').default;
import { themeStyle } from '../global-style';
import { DialogContext } from '../DialogManager';
import Icon from '../Icon';
import useOnLongPressProps from '../../utils/hooks/useOnLongPressProps';
import { AppState } from '../../utils/types';
import Folder from '@joplin/lib/models/Folder';
import NavService from '@joplin/lib/services/NavService';
import { _ } from '@joplin/lib/locale';
import { buildFolderTree, isFolderSelected, renderFolders } from '@joplin/lib/components/shared/side-menu-shared';
import { FolderEntity, FolderIcon, FolderIconType } from '@joplin/lib/services/database/types';
import { ProfileConfig } from '@joplin/lib/services/profileConfig/types';
import { getTrashFolderIcon, getTrashFolderId } from '@joplin/lib/services/trash';
import restoreItems from '@joplin/lib/services/trash/restoreItems';
import emptyTrash from '@joplin/lib/services/trash/emptyTrash';
import { ModelType } from '@joplin/lib/BaseModel';
import { TextStyle, ViewStyle } from 'react-native';
import { TouchableRipple } from 'react-native-paper';
import shim from '@joplin/lib/shim';
import SyncButton from './SyncButton';
import { substrWithEllipsis } from '@joplin/lib/string-utils';
import SideMenuButton from './SideMenuButton';

interface Props {
	themeId: number;
	dispatch: Dispatch;
	collapsedFolderIds: string[];
	notesParentType: string;
	folders: FolderEntity[];
	profileConfig: ProfileConfig;
	inboxJopId: string;
	selectedFolderId: string;
	selectedTagId: string;
}


const folderIconRightMargin = 10;

const useStyles = (themeId: number) => {
	return useMemo(() => {
		const theme = themeStyle(themeId);

		const buttonStyle: ViewStyle = {
			flex: 1,
			flexDirection: 'row',
			flexBasis: 'auto',
			height: 36,
			alignItems: 'center',
			paddingLeft: theme.marginLeft,
			paddingRight: theme.marginRight,
		};
		const buttonTextStyle: TextStyle = {
			flex: 1,
			color: theme.color,
			paddingLeft: 10,
			fontSize: theme.fontSize,
		};
		const sidebarIconStyle: TextStyle = {
			fontSize: 22,
			color: theme.color,
			width: 26,
			textAlign: 'center',
			textAlignVertical: 'center',
		};
		const folderIconBase: ViewStyle&ImageStyle = {
			marginRight: folderIconRightMargin,
			width: 27,
		};
		const folderButtonStyle: ViewStyle = {
			...buttonStyle,
			paddingLeft: 0,
		};
		const sideButtonStyle: ViewStyle = {
			...buttonStyle,
			flex: 0,
		};

		const styles = StyleSheet.create({
			menu: {
				flex: 1,
				backgroundColor: theme.backgroundColor,
			},
			button: buttonStyle,
			buttonText: buttonTextStyle,
			sidebarIcon: sidebarIconStyle,
			folderButton: folderButtonStyle,
			folderButtonText: {
				...buttonTextStyle,
				paddingLeft: 0,
			},
			folderButtonSelected: {
				...folderButtonStyle,
				backgroundColor: theme.selectedColor,
			},
			folderToggleIcon: {
				...theme.icon,
				color: theme.colorFaded,
				paddingTop: 3,
			},
			sideButton: sideButtonStyle,
			sideButtonSelected: {
				...sideButtonStyle,
			},
			sideButtonText: {
				...buttonTextStyle,
			},
			folderBaseIcon: {
				...sidebarIconStyle,
				...folderIconBase,
			},
			folderEmojiIcon: {
				...sidebarIconStyle,
				...folderIconBase,
				fontSize: theme.fontSize,
			},
			folderImageIcon: {
				...folderIconBase,
				height: 20,
				resizeMode: 'contain',
			},
		});

		return styles;
	}, [themeId]);
};

type Styles = ReturnType<typeof useStyles>;

type FolderEventHandler = (folder: FolderEntity)=> void;
interface FolderItemProps {
	themeId: number;
	hasChildren: boolean;
	collapsed: boolean;
	folder: FolderEntity;
	selected: boolean;
	depth: number;
	styles: Styles;
	alwaysShowFolderIcons: boolean;

	onPress: FolderEventHandler;
	onTogglePress: FolderEventHandler;
	onLongPress: FolderEventHandler;
}

const FolderItem: React.FC<FolderItemProps> = props => {
	const styles = useMemo(() => {
		const theme = themeStyle(props.themeId);

		return StyleSheet.create({
			buttonWrapper: { flex: 1, flexDirection: 'row' },
			folderButton: {
				flex: 1,
				flexDirection: 'row',
				flexBasis: 'auto',
				height: 36,
				alignItems: 'center',
				paddingRight: theme.marginRight,

				backgroundColor: props.selected ? theme.selectedColor : undefined,
				paddingLeft: props.depth * 10 + theme.marginLeft,
			},
			iconWrapper: {
				paddingLeft: 10,
				paddingRight: 10,
				backgroundColor: props.selected ? theme.selectedColor : undefined,
			},
		});
	}, [props.selected, props.depth, props.themeId]);
	const baseStyles = props.styles;

	const collapsed = props.collapsed;
	const iconName = collapsed ? 'chevron-down' : 'chevron-up';
	const iconComp = <IonIcon name={iconName} style={baseStyles.folderToggleIcon} />;

	const onTogglePress = useCallback(() => {
		props.onTogglePress(props.folder);
	}, [props.folder, props.onTogglePress]);

	const iconWrapper = !props.hasChildren ? null : (
		<TouchableOpacity
			style={styles.iconWrapper}
			onPress={onTogglePress}
			accessibilityLabel={_('Expand %s', props.folder.title)}

			aria-pressed={!collapsed}
			accessibilityState={{ checked: !collapsed }}
			// The togglebutton role is only supported on Android and iOS.
			// On web, the button role with aria-pressed creates a togglebutton.
			accessibilityRole={shim.mobilePlatform() === 'web' ? 'button' : 'togglebutton'}
		>
			{iconComp}
		</TouchableOpacity>
	);

	const folderIcon = Folder.unserializeIcon(props.folder.icon);

	const renderFolderIcon = (folderId: string, folderIcon: FolderIcon) => {
		if (!folderIcon) {
			if (folderId === getTrashFolderId()) {
				folderIcon = getTrashFolderIcon(FolderIconType.FontAwesome);
			} else if (props.alwaysShowFolderIcons) {
				return <IonIcon name="folder-outline" style={baseStyles.folderBaseIcon} />;
			} else {
				return null;
			}
		}

		if (folderIcon.type === FolderIconType.Emoji) {
			return <Text style={baseStyles.folderEmojiIcon}>{folderIcon.emoji}</Text>;
		} else if (folderIcon.type === FolderIconType.DataUrl) {
			return <Image style={baseStyles.folderImageIcon} source={{ uri: folderIcon.dataUrl }}/>;
		} else if (folderIcon.type === FolderIconType.FontAwesome) {
			return <Icon style={baseStyles.folderBaseIcon} name={folderIcon.name} accessibilityLabel={null}/>;
		} else {
			throw new Error(`Unsupported folder icon type: ${folderIcon.type}`);
		}
	};

	const onPress = useCallback(() => {
		props.onPress(props.folder);
	}, [props.folder, props.onPress]);

	const onLongPress = useCallback(() => {
		props.onLongPress(props.folder);
	}, [props.folder, props.onLongPress]);

	const longPressProps = useOnLongPressProps({
		onLongPress,
		actionDescription: _('Show notebook options'),
	});

	const folderTitle = Folder.displayTitle(props.folder);
	// React Native doesn't seem to include an equivalent to web's aria-level.
	// To allow screen reader users to determine whether a notebook is a subnotebook or not,
	// depth is specified with an accessibilityLabel:
	const folderDepthDescription = props.depth > 0 ? _('(level %d)', props.depth) : '';
	const accessibilityLabel = `${folderTitle}  ${folderDepthDescription}`.trim();
	return (
		<View key={props.folder.id} style={styles.buttonWrapper}>
			<TouchableRipple
				style={{ flex: 1, flexBasis: 'auto' }}
				onPress={onPress}
				{...longPressProps}
				accessibilityHint={_('Opens notebook')}
				accessibilityState={{ selected: props.selected }}
				aria-current={props.selected}
				role='button'
			>
				<View style={styles.folderButton}>
					{renderFolderIcon(props.folder.id, folderIcon)}
					<Text
						numberOfLines={1}
						style={baseStyles.folderButtonText}
						accessibilityLabel={accessibilityLabel}
					>
						{folderTitle}
					</Text>
				</View>
			</TouchableRipple>
			{iconWrapper}
		</View>
	);
};

const SideMenuContentComponent = (props: Props) => {
	const alwaysShowFolderIcons = useMemo(() => Folder.shouldShowFolderIcons(props.folders), [props.folders]);
	const styles_ = useStyles(props.themeId);

	const dialogs = useContext(DialogContext);

	const folder_press = (folder: FolderEntity) => {
		props.dispatch({ type: 'SIDE_MENU_CLOSE' });

		props.dispatch({
			type: 'NAV_GO',
			routeName: 'Notes',
			folderId: folder.id,
		});
	};

	const folder_longPress = async (folderOrAll: FolderEntity | string) => {
		if (folderOrAll === 'all') return;

		const folder = folderOrAll as FolderEntity;

		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
		const menuItems: any[] = [];

		if (folder && folder.id === getTrashFolderId()) {
			menuItems.push({
				text: _('Empty trash'),
				onPress: async () => {
					dialogs.prompt('', _('This will permanently delete all items in the trash. Continue?'), [
						{
							text: _('Empty trash'),
							onPress: async () => {
								await emptyTrash();
							},
						},
						{
							text: _('Cancel'),
							onPress: () => { },
							style: 'cancel',
						},
					]);
				},
				style: 'destructive',
			});

		} else if (folder && !!folder.deleted_time) {
			menuItems.push({
				text: _('Restore'),
				onPress: async () => {
					await restoreItems(ModelType.Folder, [folder.id]);
				},
				style: 'destructive',
			});

			// Alert.alert(
			// 	'',
			// 	_('Notebook: %s', folder.title),
			// 	[
			// 		{
			// 			text: _('Restore'),
			// 			onPress: async () => {
			// 				await restoreItems(ModelType.Folder, [folder.id]);
			// 			},
			// 			style: 'destructive',
			// 		},
			// 		{
			// 			text: _('Cancel'),
			// 			onPress: () => {},
			// 			style: 'cancel',
			// 		},
			// 	],
			// 	{
			// 		cancelable: false,
			// 	},
			// );
		} else {
			const generateFolderDeletion = () => {
				const folderDeletion = (message: string) => {
					dialogs.prompt('', message, [
						{
							text: _('OK'),
							onPress: () => {
								void Folder.delete(folder.id, { toTrash: true, sourceDescription: 'side-menu-content (long-press)' });
							},
						},
						{
							text: _('Cancel'),
							onPress: () => { },
							style: 'cancel',
						},
					]);
				};

				if (folder.id === props.inboxJopId) {
					return folderDeletion(
						_('Delete the Inbox notebook?\n\nIf you delete the inbox notebook, any email that\'s recently been sent to it may be lost.'),
					);
				}
				return folderDeletion(_('Move notebook "%s" to the trash?\n\nAll notes and sub-notebooks within this notebook will also be moved to the trash.', substrWithEllipsis(folder.title, 0, 32)));
			};

			menuItems.push({
				text: _('Edit'),
				onPress: () => {
					props.dispatch({ type: 'SIDE_MENU_CLOSE' });

					props.dispatch({
						type: 'NAV_GO',
						routeName: 'Folder',
						folderId: folder.id,
					});
				},
			});

			menuItems.push({
				text: _('Delete'),
				onPress: generateFolderDeletion,
				style: 'destructive',
			});
		}

		menuItems.push({
			text: _('Cancel'),
			onPress: () => {},
			style: 'cancel',
		});

		dialogs.prompt(
			'',
			_('Notebook: %s', folder.title),
			menuItems,
		);
	};

	const folder_togglePress = (folder: FolderEntity) => {
		props.dispatch({
			type: 'FOLDER_TOGGLE',
			id: folder.id,
		});
	};

	const tagButton_press = () => {
		props.dispatch({ type: 'SIDE_MENU_CLOSE' });

		props.dispatch({
			type: 'NAV_GO',
			routeName: 'Tags',
		});
	};

	const switchProfileButton_press = () => {
		props.dispatch({ type: 'SIDE_MENU_CLOSE' });

		props.dispatch({
			type: 'NAV_GO',
			routeName: 'ProfileSwitcher',
		});
	};

	const configButton_press = () => {
		props.dispatch({ type: 'SIDE_MENU_CLOSE' });
		void NavService.go('Config');
	};

	const allNotesButton_press = () => {
		props.dispatch({ type: 'SIDE_MENU_CLOSE' });

		props.dispatch({
			type: 'NAV_GO',
			routeName: 'Notes',
			smartFilterId: 'c3176726992c11e9ac940492261af972',
		});
	};

	const newFolderButton_press = () => {
		props.dispatch({ type: 'SIDE_MENU_CLOSE' });

		props.dispatch({
			type: 'NAV_GO',
			routeName: 'Folder',
			folderId: null,
		});
	};


	const renderFolderItem = (folder: FolderEntity, hasChildren: boolean, depth: number) => {
		return <FolderItem
			key={`folder-item-${folder.id}`}
			themeId={props.themeId}
			hasChildren={hasChildren}
			depth={depth}
			collapsed={props.collapsedFolderIds.includes(folder.id)}
			selected={isFolderSelected(folder, { selectedFolderId: props.selectedFolderId, notesParentType: props.notesParentType })}
			styles={styles_}
			folder={folder}
			alwaysShowFolderIcons={alwaysShowFolderIcons}
			onPress={folder_press}
			onLongPress={folder_longPress}
			onTogglePress={folder_togglePress}
		/>;
	};

	type SidebarButtonOptions = {
		onPress?: ()=> void;
		selected?: boolean;
		isHeader?: boolean;
	};
	const renderSidebarButton = (
		key: string,
		title: string,
		iconName: string,
		{ onPress = null, selected = false, isHeader = false }: SidebarButtonOptions = {},
	) => {
		const icon = <Icon name={`ionicon ${iconName}`} style={styles_.sidebarIcon} accessibilityLabel={null} />;

		return <SideMenuButton
			themeId={props.themeId}
			key={key}
			onPress={onPress}
			selected={selected}
			contentRole={isHeader ? 'header' : undefined}
			icon={icon}
			text={title}
		/>;
	};

	const makeDivider = (key: string) => {
		const theme = themeStyle(props.themeId);
		return <View role='separator' style={{ marginTop: 15, marginBottom: 15, flex: -1, borderBottomWidth: 1, borderBottomColor: theme.dividerColor }} key={key}></View>;
	};

	const renderBottomPanel = () => {
		const theme = themeStyle(props.themeId);

		const items = [];

		items.push(makeDivider('divider_1'));

		items.push(renderSidebarButton('newFolder_button', _('New Notebook'), 'folder-open', { onPress: newFolderButton_press }));

		items.push(renderSidebarButton('tag_button', _('Tags'), 'pricetag', { onPress: tagButton_press }));

		if (props.profileConfig && props.profileConfig.profiles.length > 1) {
			items.push(renderSidebarButton('switchProfile_button', _('Switch profile'), 'people-circle-outline', { onPress: switchProfileButton_press }));
		}

		items.push(renderSidebarButton('config_button', _('Configuration'), 'settings', { onPress: configButton_press }));

		items.push(makeDivider('divider_2'));

		items.push(
			<SyncButton
				key='sync_button'
			/>,
		);

		return <View style={{ flex: 0, flexDirection: 'column', flexBasis: 'auto', paddingBottom: theme.marginBottom }}>{items}</View>;
	};

	let items = [];

	const theme = themeStyle(props.themeId);

	// HACK: inner height of ScrollView doesn't appear to be calculated correctly when
	// using padding. So instead creating blank elements for padding bottom and top.
	items.push(<View style={{ height: theme.marginTop }} key="bottom_top_hack" />);

	items.push(renderSidebarButton('all_notes', _('All notes'), 'document', {
		onPress: allNotesButton_press,
		selected: props.notesParentType === 'SmartFilter',
	}));

	items.push(makeDivider('divider_all'));

	items.push(renderSidebarButton('folder_header', _('Notebooks'), 'folder', {
		isHeader: true,
	}));

	const folderTree = useMemo(() => {
		return buildFolderTree(props.folders);
	}, [props.folders]);

	if (props.folders.length) {
		const result = renderFolders({
			folderTree,
			collapsedFolderIds: props.collapsedFolderIds,
		}, renderFolderItem);

		const folderItems = result.items;
		items = items.concat(folderItems);
	}

	const style = {
		flex: 1,
		borderRightWidth: 1,
		borderRightColor: theme.dividerColor,
		backgroundColor: theme.backgroundColor,
	};

	return (
		<View style={style}>
			<View style={{ flex: 1 }}>
				<ScrollView scrollsToTop={false} style={styles_.menu}>
					{items}
				</ScrollView>
				{renderBottomPanel()}
			</View>
		</View>
	);
};

export default connect((state: AppState) => {
	return {
		folders: state.folders,
		selectedFolderId: state.selectedFolderId,
		selectedTagId: state.selectedTagId,
		notesParentType: state.notesParentType,
		locale: state.settings.locale,
		themeId: state.settings.theme,
		collapsedFolderIds: state.collapsedFolderIds,
		profileConfig: state.profileConfig,
		inboxJopId: state.settings['sync.10.inboxId'],
	};
})(SideMenuContentComponent);
