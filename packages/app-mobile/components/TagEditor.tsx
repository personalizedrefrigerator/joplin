import * as React from 'react';

import { StyleSheet, View, Text, ScrollView, ViewStyle } from 'react-native';
import { _ } from '@joplin/lib/locale';
import { themeStyle } from './global-style';
import ComboBox from './ComboBox';
import IconButton from './IconButton';
import { useCallback, useMemo } from 'react';
import { TagEntity } from '@joplin/lib/services/database/types';
import { connect } from 'react-redux';
import { AppState } from '../utils/types';

interface Props {
	themeId: number;
	tags: string[];
	allTags: TagEntity[];
	style: ViewStyle;
	onRemoveTag: (tag: string)=> void;
	onAddTag: (tag: string)=> void;
}

const useStyles = (themeId: number) => {
	return useMemo(() => {
		const theme = themeStyle(themeId);
		return StyleSheet.create({
			tag: {
				borderRadius: 16,
				paddingStart: 8,
				backgroundColor: theme.backgroundColor3,
				color: theme.color3,
				flexDirection: 'row',
				alignItems: 'center',
				gap: 4,
			},
			tagText: {
				color: theme.color3,
				fontSize: theme.fontSize,
			},
			removeTagButton: {
				color: theme.color3,
				fontSize: theme.fontSize,
				padding: 3,
			},
			tagBoxRoot: {
				flexDirection: 'column',
				flexGrow: 1,
				flexShrink: 1,
			},
			tagBoxScrollView: {
				borderColor: theme.dividerColor,
				borderWidth: 1,
				borderRadius: 8,
				height: 80,
				flexShrink: 1,
			},
			tagBoxContent: {
				flexDirection: 'row',
				gap: 4,
				paddingTop: theme.itemMarginTop,
				paddingBottom: theme.itemMarginBottom,
				paddingLeft: 4,
				paddingRight: 4,
				flexWrap: 'wrap',
				maxWidth: '100%',
			},
			header: {
				...theme.headerStyle,
				fontSize: theme.fontSize,
				marginBottom: theme.itemMarginTop,
			},
			divider: {
				marginVertical: theme.margin,
			},
			tagSearch: {
				flexBasis: 240,
				flexShrink: 1,
			},
		});
	}, [themeId]);
};

type Styles = ReturnType<typeof useStyles>;

interface TagChipProps {
	title: string;
	themeId: number;
	styles: Styles;
	onRemove: ()=> void;
}

const TagCard: React.FC<TagChipProps> = props => {
	return <View style={props.styles.tag}>
		<Text style={props.styles.tagText}>{props.title}</Text>
		<IconButton
			themeId={props.themeId}
			description={_('Remove %s', props.title)}
			iconName='fas fa-times-circle'
			iconStyle={props.styles.removeTagButton}
			onPress={props.onRemove}
		/>
	</View>;
};

interface TagsBoxProps {
	tags: string[];
	styles: Styles;
	themeId: number;
	onRemoveTag: (tag: string)=> void;
}

const TagsBox: React.FC<TagsBoxProps> = props => {
	return <View style={props.styles.tagBoxRoot}>
		<Text style={props.styles.header} role='heading'>{_('Associated tags:')}</Text>
		<ScrollView style={props.styles.tagBoxScrollView} contentContainerStyle={props.styles.tagBoxContent}>
			{props.tags.map(tag => (
				<TagCard
					key={`tag-${tag}`}
					title={tag}
					styles={props.styles}
					themeId={props.themeId}
					onRemove={() => props.onRemoveTag(tag)}
				/>
			))}
		</ScrollView>
	</View>;
};

const normalizeTag = (tagText: string) => tagText.trim().toLowerCase();

const TagEditor: React.FC<Props> = props => {
	const styles = useStyles(props.themeId);

	const comboBoxItems = useMemo(() => {
		return props.allTags
			// Exclude tags already associated with the note
			.filter(tag => !props.tags.includes(tag.title))
			.map(tag => {
				const title = tag.title ?? 'Untitled';
				return {
					title,
					icon: 'fas fa-tag',
					accessibilityHint: _('Adds tag'),
				};
			});
	}, [props.tags, props.allTags]);

	const onAddTag = useCallback((title: string) => {
		props.onAddTag(normalizeTag(title));
	}, [props.onAddTag]);

	const onComboBoxSelect = useCallback((item: { title: string }) => {
		onAddTag(item.title);
	}, [onAddTag]);

	const allTagsSet = useMemo(() => {
		return new Set([
			...props.allTags.map(tag => tag.title),
			...props.tags,
		]);
	}, [props.allTags, props.tags]);

	const onCanAddTag = useCallback((tag: string) => {
		return !allTagsSet.has(normalizeTag(tag));
	}, [allTagsSet]);

	return <View style={props.style}>
		<TagsBox
			themeId={props.themeId}
			styles={styles}
			tags={props.tags}
			onRemoveTag={props.onRemoveTag}
		/>
		<View style={styles.divider}/>
		<Text style={styles.header} role='heading'>{_('Add tags:')}</Text>
		<ComboBox
			items={comboBoxItems}
			onItemSelected={onComboBoxSelect}
			onAddItem={onAddTag}
			canAddItem={onCanAddTag}
			style={styles.tagSearch}
			placeholder={_('Search for tags...')}
		/>
	</View>;
};

export default connect((state: AppState) => ({
	allTags: state.tags,
}))(TagEditor);
