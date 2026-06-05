import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { View, StyleSheet } from 'react-native';
import { connect } from 'react-redux';
import Folder from '@joplin/lib/models/Folder';
import BaseModel from '@joplin/lib/BaseModel';
import { ScreenHeader } from '../ScreenHeader';
import shim from '@joplin/lib/shim';
import { _ } from '@joplin/lib/locale';
import FolderPicker from '../FolderPicker';
import TextInput from '../TextInput';
import { FolderEntity } from '@joplin/lib/services/database/types';
import { AppState } from '../../utils/types';
import { Dispatch } from 'redux';
import createRootStyle from '../../utils/createRootStyle';

interface Props {
	folderId: string;
	selectedFolderId: string;
	themeId: number;
	folders: FolderEntity[];
	dispatch: Dispatch;
}

const FolderScreenComponent: React.FC<Props> = props => {
	const { folderId, themeId, folders, dispatch } = props;

	const [folder, setFolder] = useState<FolderEntity>(() => Folder.new());
	const [lastSavedFolder, setLastSavedFolder] = useState<FolderEntity | null>(null);

	useEffect(() => {
		if (!folderId) {
			const newFolder = Folder.new();
			setFolder(newFolder);
			setLastSavedFolder({ ...newFolder });
		} else {
			// eslint-disable-next-line promise/prefer-await-to-then -- Old code before rule was applied
			void Folder.load(folderId).then(loadedFolder => {
				setFolder(loadedFolder);
				setLastSavedFolder({ ...loadedFolder });
			});
		}
	}, [folderId]);

	const isModified = useCallback(() => {
		if (!folder || !lastSavedFolder) return false;
		const diff = BaseModel.diffObjects(folder, lastSavedFolder);
		delete diff.type_;
		return !!Object.getOwnPropertyNames(diff).length;
	}, [folder, lastSavedFolder]);

	const folderComponent_change = useCallback((propName: keyof FolderEntity, propValue: string) => {
		setFolder(prevFolder => ({
			...prevFolder,
			[propName]: propValue,
		}));
	}, []);

	const title_changeText = useCallback((text: string) => {
		folderComponent_change('title', text);
	}, [folderComponent_change]);

	const parent_changeValue = useCallback((parent: string) => {
		folderComponent_change('parent_id', parent);
	}, [folderComponent_change]);

	const saveFolderButton_press = useCallback(async () => {
		let folderToSave = { ...folder };

		try {
			if (folderToSave.id && !(await Folder.canNestUnder(folderToSave.id, folderToSave.parent_id))) throw new Error(_('Cannot move notebook to this location'));
			folderToSave = await Folder.save(folderToSave, { userSideValidation: true });
		} catch (error) {
			void shim.showErrorDialog(_('The notebook could not be saved: %s', error.message));
			return;
		}

		setLastSavedFolder({ ...folderToSave });
		setFolder(folderToSave);

		dispatch({
			type: 'NAV_GO',
			routeName: 'Notes',
			folderId: folderToSave.id,
		});
	}, [folder, dispatch]);

	const rootStyle = useMemo(() => createRootStyle(themeId), [themeId]);

	const saveButtonDisabled = !isModified() || !folder.title;

	return (
		<View style={rootStyle.root}>
			<ScreenHeader title={_('Edit notebook')} showSaveButton={true} saveButtonDisabled={saveButtonDisabled} onSaveButtonPress={saveFolderButton_press} showSideMenuButton={false} showSearchButton={false} />
			<TextInput
				themeId={themeId}
				placeholder={_('Enter notebook title')}
				autoFocus={true}
				value={folder.title}
				onChangeText={title_changeText}
				editable={!folder.encryption_applied}
			/>
			<View style={styles.folderPickerContainer}>
				<FolderPicker
					themeId={themeId}
					placeholder={_('Select parent notebook')}
					folders={Folder.getRealFolders(folders)}
					selectedFolderId={folder.parent_id}
					onValueChange={parent_changeValue}
					mustSelect
					darkText
				/>
			</View>
			<View style={{ flex: 1 }} />
		</View>
	);
};

export default connect((state: AppState) => {
	return {
		folderId: state.selectedFolderId,
		themeId: state.settings.theme,
		folders: state.folders.filter((folder) => folder.id !== state.selectedFolderId),
	};
})(FolderScreenComponent);

const styles = StyleSheet.create({
	folderPickerContainer: {
		height: 46,
		paddingLeft: 14,
		paddingRight: 14,
		paddingTop: 12,
		paddingBottom: 12,
	},
});

