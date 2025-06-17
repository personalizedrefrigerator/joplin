import * as React from 'react';
import { render, screen } from '@testing-library/react-native';
import createMockReduxStore from '../utils/testing/createMockReduxStore';
import TestProviderStack from './testing/TestProviderStack';
import ComboBox, { Option } from './ComboBox';
import { useMemo } from 'react';

interface Item {
	title: string;
}

interface WrapperProps {
	items: Item[];
	onItemSelected?: (item: Item)=> void;
}

const store = createMockReduxStore();
const WrappedComboBox: React.FC<WrapperProps> = ({
	items,
	onItemSelected = jest.fn(),
}: WrapperProps) => {
	const mappedItems = useMemo(() => {
		return items.map((item): Option => ({
			title: item.title,
			icon: undefined,
			accessibilityHint: undefined,
		}));
	}, [items]);

	return <TestProviderStack store={store}>
		<ComboBox
			items={mappedItems}
			style={{}}
			onItemSelected={onItemSelected}
			placeholder={'Test combobox'}
		/>
	</TestProviderStack>;
};

const getSearchInput = () => {
	return screen.getByPlaceholderText('Test combobox');
};
const getSearchResults = () => {
	return screen.getAllByRole('menuitem');
};

describe('ComboBox', () => {
	test('should list all items when the search query is empty', () => {
		const testItems = [
			{ title: 'test 1' },
			{ title: 'test 2' },
			{ title: 'test 3' },
		];
		render(
			<WrappedComboBox
				items={testItems}
			/>,
		);

		expect(getSearchInput()).toHaveTextContent('');
		expect(getSearchResults()).toHaveLength(3);
	});
});
