import * as React from 'react';
import { useState, useCallback, CSSProperties, useEffect, useRef, useId } from 'react';
import { _ } from '@joplin/lib/locale';
import { focus } from '@joplin/lib/utils/focusHandler';

interface Props {
	inputType?: string;
	inputStyle: CSSProperties;

	value: string;
	onChange: (newValue: string)=> void;

	suggestedValues: string[];
	renderOption: (suggestedValue: string)=> React.ReactElement;

	controls?: React.ReactNode;

	inputId: string;
}

const suggestionMatchesFilter = (suggestion: string, filter: string) => {
	return suggestion.toLowerCase().startsWith(filter.toLowerCase());
};

const InlineCombobox: React.FC<Props> = ({ inputType, controls, inputStyle, value, suggestedValues, renderOption, onChange, inputId }) => {
	const [showList, setShowList] = useState(false);
	const [visibleSuggestions, setVisibleSuggestions] = useState<string[]>([]);
	const containerRef = useRef<HTMLDivElement|null>(null);
	const inputRef = useRef<HTMLInputElement|null>(null);
	const listboxRef = useRef<HTMLDivElement|null>(null);

	const [filteredSuggestions, setFilteredSuggestions] = useState(suggestedValues);

	useEffect(() => {
		setFilteredSuggestions(suggestedValues);
	}, [suggestedValues]);

	const selectedIndex = filteredSuggestions.indexOf(value);

	useEffect(() => {
		setVisibleSuggestions(filteredSuggestions);
	}, [filteredSuggestions]);

	const focusInput = useCallback(() => {
		focus('ComboBox/focus input', inputRef.current);
	}, []);

	const onTextChange: React.ChangeEventHandler<HTMLInputElement> = useCallback((event) => {
		const newValue = event.target.value;
		onChange(newValue);
		setShowList(true);

		const filteredSuggestions = suggestedValues.filter((suggestion: string) =>
			suggestionMatchesFilter(suggestion, newValue),
		);
		// If no suggestions, show all fonts
		setFilteredSuggestions(filteredSuggestions.length > 0 ? filteredSuggestions : suggestedValues);
	}, [onChange, suggestedValues]);

	const onFocus: React.FocusEventHandler<HTMLElement> = useCallback(() => {
		setShowList(true);
	}, []);

	const onBlur = useCallback(() => {
		const hasHoverOrFocus = !!containerRef.current.querySelector(':focus-within, :hover');
		if (!hasHoverOrFocus) {
			setShowList(false);
		}
	}, []);

	const onItemClick: React.MouseEventHandler<HTMLDivElement> = useCallback((event) => {
		const newValue = event.currentTarget.getAttribute('data-key');
		if (!newValue) return;

		focusInput();
		onChange(newValue);
		setFilteredSuggestions(suggestedValues);
	}, [onChange, suggestedValues, focusInput]);

	const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = useCallback(event => {
		if (event.nativeEvent.isComposing) return;

		let closestIndex = selectedIndex;
		if (selectedIndex === -1) {
			closestIndex = filteredSuggestions.findIndex(suggestion => {
				return suggestionMatchesFilter(suggestion, value);
			});
		}

		const isGoToNext = event.code === 'ArrowDown';
		if (isGoToNext || event.code === 'ArrowUp') {
			event.preventDefault();

			if (!event.altKey) {
				let newSelectedIndex;
				if (isGoToNext) {
					newSelectedIndex = (selectedIndex + 1) % filteredSuggestions.length;
				} else {
					newSelectedIndex = selectedIndex - 1;
					if (newSelectedIndex < 0) {
						newSelectedIndex += filteredSuggestions.length;
					}
				}
				const newKey = filteredSuggestions[newSelectedIndex];
				onChange(newKey);
				const targetChild = listboxRef.current.children[newSelectedIndex];
				targetChild?.scrollIntoView({ block: 'nearest' });
			}
			setShowList(true);
		} else if (event.code === 'Enter') {
			event.preventDefault();
			onChange(filteredSuggestions[closestIndex]);
			setShowList(false);
		} else if (event.code === 'Escape') {
			event.preventDefault();
			setShowList(false);
		}
	}, [filteredSuggestions, value, selectedIndex, onChange]);

	const valuesListId = useId();
	let selectedSuggestionId = undefined;

	const suggestionElements = [];
	for (const key of visibleSuggestions) {
		const selected = key === value;
		const id = `combobox-${valuesListId}-option-${key}`;
		if (selected) {
			selectedSuggestionId = id;
		}

		suggestionElements.push(
			<div
				key={key}
				data-key={key}
				className={`combobox-suggestion-option ${selected ? '-selected' : ''}`}
				role='option'
				onClick={onItemClick}
				aria-selected={selected}
				id={id}
			>{renderOption(key)}</div>,
		);
	}

	return (
		<div
			className={`combobox-wrapper ${showList ? '-expanded' : ''}`}
			onFocus={onFocus}
			onBlur={onBlur}

			onKeyDown={onKeyDown}
			ref={containerRef}
		>
			<input
				type={inputType ?? 'text'}
				style={inputStyle}
				value={value}
				onChange={onTextChange}
				onKeyDown={onKeyDown}
				spellCheck={false}
				id={inputId}
				ref={inputRef}

				role='combobox'
				aria-autocomplete='list'
				aria-controls={valuesListId}
				aria-expanded={showList}
				aria-activedescendant={selectedSuggestionId}
			/>
			<div className='suggestions'>
				{
					// Custom controls
					controls
				}
				<div
					role='listbox'
					aria-label={_('Font picker')}
					id={valuesListId}
					ref={listboxRef}
				>
					{suggestionElements}
				</div>
			</div>
		</div>
	);
};

export default InlineCombobox;
