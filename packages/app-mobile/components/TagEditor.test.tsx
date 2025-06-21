import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import createMockReduxStore from '../utils/testing/createMockReduxStore';
import TestProviderStack from './testing/TestProviderStack';
import { TagEntity } from '@joplin/lib/services/database/types';
import { useCallback, useEffect, useState } from 'react';
import TagEditor from './TagEditor';
import Setting from '@joplin/lib/models/Setting';

interface WrapperProps {
	allTags: TagEntity[];
	initialTags: string[];
	onTagsChanged: (tags: string[])=> void;
}

const emptyStyle = {};

const store = createMockReduxStore();
const WrappedTagEditor: React.FC<WrapperProps> = props => {
	const [tags, setTags] = useState(props.initialTags);

	const onAddTag = useCallback((tag: string) => {
		setTags(tags => [...tags, tag]);
	}, []);
	const onRemoveTag = useCallback((tag: string) => {
		setTags(tags => tags.filter(t => t !== tag));
	}, []);

	useEffect(() => {
		props.onTagsChanged(tags);
	}, [tags, props.onTagsChanged]);

	return <TestProviderStack store={store}>
		<TagEditor
			themeId={Setting.THEME_LIGHT}
			style={emptyStyle}
			onRemoveTag={onRemoveTag}
			onAddTag={onAddTag}
			allTags={props.allTags}
			tags={tags}
		/>
	</TestProviderStack>;
};

describe('TagEditor', () => {
	test('clicking "remove" should remove a tag', () => {
		const initialTags = ['test', 'testing'];
		let currentTags = initialTags;
		const onTagsChanged = (tags: string[]) => {
			currentTags = tags;
		};

		const { unmount } = render(
			<WrappedTagEditor
				allTags={initialTags.map(t => ({ title: t }))}
				initialTags={initialTags}
				onTagsChanged={onTagsChanged}
			/>,
		);

		const removeButton = screen.getByRole('button', { name: 'Remove testing' });
		fireEvent.press(removeButton);
		expect(currentTags).toEqual(['test']);

		// Manually unmount to prevent warnings
		unmount();
	});
});

