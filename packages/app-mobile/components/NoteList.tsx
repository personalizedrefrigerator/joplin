import * as React from 'react';

import { useCallback, useEffect, useMemo, useRef } from 'react';

import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { FlatList, Text, StyleSheet, Button, View } from 'react-native';
import { FolderEntity, NoteEntity } from '@joplin/lib/services/database/types';
import { AppState } from '../utils/types';
import getEmptyFolderMessage from '@joplin/lib/components/shared/NoteList/getEmptyFolderMessage';
import Folder from '@joplin/lib/models/Folder';

import { _ } from '@joplin/lib/locale';
import NoteItem from './NoteItem';
import { themeStyle } from './global-style';

interface NoteListProps {
	themeId: number;
	dispatch: Dispatch;
	notesSource: string;
	items: NoteEntity[];
	folders: FolderEntity[];
	noteSelectionEnabled?: boolean;
	selectedFolderId: string|null;
}

const useStyles = (themeId: number) => {
	return useMemo(() => {
		const theme = themeStyle(themeId);
		return StyleSheet.create({
			noItemMessage: {
				paddingLeft: theme.marginLeft,
				paddingRight: theme.marginRight,
				paddingTop: theme.marginTop,
				paddingBottom: theme.marginBottom,
				fontSize: theme.fontSize,
				color: theme.color,
				textAlign: 'center',
			},
			noNotebookView: {

			},
		});
	}, [themeId]);
};

const NoteListComponent: React.FC<NoteListProps> = props => {
	const { themeId, dispatch, notesSource, items, folders, selectedFolderId } = props;

	const rootRef = useRef<FlatList>(null);
	const styles = useStyles(themeId);

	const createNotebookButton_click = useCallback(() => {
		dispatch({
			type: 'NAV_GO',
			routeName: 'Folder',
			folderId: null,
		});
	}, [dispatch]);

	// Make sure scroll position is reset when switching from one folder to another or to a tag list.
	useEffect(() => {
		if (rootRef.current) {
			rootRef.current.scrollToOffset({ offset: 0, animated: false });
		}
	}, [notesSource]);

	// `enableEmptySections` is to fix this warning: https://github.com/FaridSafi/react-native-gifted-listview/issues/39

	if (items.length) {
		return <FlatList
			ref={rootRef}
			data={items}
			renderItem={({ item }) => <NoteItem note={item} />}
			keyExtractor={item => item.id}
		/>;
	} else {
		if (!Folder.atLeastOneRealFolderExists(folders)) {
			const noItemMessage = _('You currently have no notebooks.');
			return (
				<View style={styles.noNotebookView}>
					<Text style={styles.noItemMessage}>{noItemMessage}</Text>
					<Button title={_('Create a notebook')} onPress={createNotebookButton_click} />
				</View>
			);
		} else {
			return <Text style={styles.noItemMessage}>
				{getEmptyFolderMessage(folders, selectedFolderId)}
			</Text>;
		}
	}
};


const NoteList = connect((state: AppState) => {
	return {
		items: state.notes,
		folders: state.folders,
		notesSource: state.notesSource,
		themeId: state.settings.theme,
		noteSelectionEnabled: state.noteSelectionEnabled,
		selectedFolderId: state.selectedFolderId,
	};
})(NoteListComponent);

export default NoteList;
