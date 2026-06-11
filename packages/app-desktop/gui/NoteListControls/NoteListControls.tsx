import { AppState } from '../../app.reducer';
import * as React from 'react';
import { useEffect, useRef, useMemo, useContext } from 'react';
import SearchBar from '../SearchBar/SearchBar';
import Button, { ButtonLevel, ButtonSize, buttonSizePx } from '../Button/Button';
import CommandService from '@joplin/lib/services/CommandService';
import { runtime as focusSearchRuntime } from './commands/focusSearch';
import Note from '@joplin/lib/models/Note';
import { notesSortOrderNextField } from '@joplin/lib/services/sortOrder/notesSortOrderUtils';
import { _ } from '@joplin/lib/locale';
import { connect } from 'react-redux';
import stateToWhenClauseContext from '../../services/commands/stateToWhenClauseContext';
import { getTrashFolderId } from '@joplin/lib/services/trash';
import { Breakpoints } from '../NoteList/utils/types';
import { stateUtils } from '@joplin/lib/reducer';
import { WindowIdContext } from '../NewWindowOrIFrame';

interface Props {
	showNewNoteButtons: boolean;
	sortOrderButtonsVisible: boolean;
	sortOrderField: string;
	sortOrderReverse: boolean;
	notesParentType: string;
	height: number;
	width: number;
	newNoteButtonEnabled: boolean;
	newTodoButtonEnabled: boolean;
	setNewNoteButtonElement: React.Dispatch<React.SetStateAction<Element>>;
	lineCount: number;
	breakpoint: number;
	dynamicBreakpoints: Breakpoints;
	buttonSize: ButtonSize;
	padding: number;
	buttonVerticalGap: number;
}

function NoteListControls(props: Props) {
	const searchBarRef = useRef(null);
	const newTodoButtonRef = useRef(null);
	const noteControlsRef = useRef(null);
	const searchAndSortRef = useRef(null);

	const breakpoint = props.breakpoint;
	const dynamicBreakpoints = props.dynamicBreakpoints;
	const lineCount = props.lineCount;

	const noteButtonText = useMemo(() => {
		if (breakpoint === dynamicBreakpoints.Sm) {
			return '';
		} else if (breakpoint === dynamicBreakpoints.Md) {
			return _('note');
		} else {
			return _('New note');
		}
	}, [breakpoint, dynamicBreakpoints]);

	const todoButtonText = useMemo(() => {
		if (breakpoint === dynamicBreakpoints.Sm) {
			return '';
		} else if (breakpoint === dynamicBreakpoints.Md) {
			return _('to-do');
		} else {
			return _('New to-do');
		}
	}, [breakpoint, dynamicBreakpoints]);

	const noteIcon = useMemo(() => {
		if (breakpoint === dynamicBreakpoints.Sm) {
			return 'icon-note';
		} else {
			return 'fas fa-plus';
		}
	}, [breakpoint, dynamicBreakpoints]);

	const todoIcon = useMemo(() => {
		if (breakpoint === dynamicBreakpoints.Sm) {
			return 'far fa-check-square';
		} else {
			return 'fas fa-plus';
		}
	}, [breakpoint, dynamicBreakpoints]);

	const showTooltip = useMemo(() => {
		if (breakpoint === dynamicBreakpoints.Sm) {
			return true;
		} else {
			return false;
		}
	}, [breakpoint, dynamicBreakpoints.Sm]);

	useEffect(() => {
		if (lineCount === 1) {
			noteControlsRef.current.style.flexDirection = 'row';
			searchAndSortRef.current.style.flex = '2 1 50%';
		} else {
			noteControlsRef.current.style.flexDirection = 'column';
		}
	}, [lineCount]);

	useEffect(() => {
		CommandService.instance().registerRuntime('focusSearch', focusSearchRuntime(searchBarRef));

		return function() {
			CommandService.instance().unregisterRuntime('focusSearch');
		};
	}, []);

	function onNewTodoButtonClick() {
		void CommandService.instance().execute('newTodo');
	}

	function onNewNoteButtonClick() {
		void CommandService.instance().execute('newNote');
	}

	function onSortOrderFieldButtonClick() {
		void CommandService.instance().execute('toggleNotesSortOrderField');
	}

	function onSortOrderReverseButtonClick() {
		void CommandService.instance().execute('toggleNotesSortOrderReverse');
	}

	function sortOrderFieldTooltip() {
		const term1 = CommandService.instance().label('toggleNotesSortOrderField');
		const field = props.sortOrderField;
		const term2 = Note.fieldToLabel(field);
		const term3 = Note.fieldToLabel(notesSortOrderNextField(field));
		return `${term1}:\n ${term2} -> ${term3}`;
	}

	function sortOrderFieldIcon() {
		const defaultIcon = 'fas fa-cog';

		const field = props.sortOrderField;
		const iconMap: Record<string, string> = {
			user_updated_time: 'far fa-calendar-alt',
			user_created_time: 'far fa-calendar-plus',
			title: 'fas fa-font',
			order: 'fas fa-wrench',
			todo_due: 'fas fa-calendar-check',
			todo_completed: 'fas fa-check',
		};
		return `${iconMap[field] || defaultIcon} ${field}`;
	}

	function sortOrderReverseIcon() {
		return props.sortOrderReverse ? 'fas fa-long-arrow-alt-up' : 'fas fa-long-arrow-alt-down';
	}

	function showsSortOrderButtons() {
		let visible = props.sortOrderButtonsVisible;
		if (props.notesParentType === 'Search') visible = false;
		return visible;
	}

	function renderNewNoteButtons() {
		if (!props.showNewNoteButtons) return null;

		return (
			<div className="new-note-todo-buttons">
				<Button
					ref={(el: Element) => {
						props.setNewNoteButtonElement(el);
					}}
					className="new-note-button"
					tooltip={ showTooltip ? CommandService.instance().label('newNote') : '' }
					iconName={noteIcon}
					title={_('%s', noteButtonText)}
					level={ButtonLevel.Primary}
					size={props.buttonSize}
					onClick={onNewNoteButtonClick}
					disabled={!props.newNoteButtonEnabled}
				/>
				<Button ref={newTodoButtonRef}
					className="new-todo-button"
					tooltip={ showTooltip ? CommandService.instance().label('newTodo') : '' }
					iconName={todoIcon}
					title={_('%s', todoButtonText)}
					level={ButtonLevel.Secondary}
					size={props.buttonSize}
					onClick={onNewTodoButtonClick}
					disabled={!props.newTodoButtonEnabled}
				/>
			</div>
		);
	}

	const windowId = useContext(WindowIdContext);
	return (
		<div className="note-list-controls" ref={noteControlsRef} style={{ padding: props.padding, gap: props.buttonVerticalGap }}>
			{renderNewNoteButtons()}
			<div className="search-and-sort" ref={searchAndSortRef}>
				<SearchBar inputRef={searchBarRef} windowId={windowId}/>
				{showsSortOrderButtons() &&
					<div className="sort-order-buttons">
						<Button
							className="sort-order-field-button"
							style={{ minWidth: buttonSizePx(props.buttonSize), maxWidth: buttonSizePx(props.buttonSize) }}
							tooltip={sortOrderFieldTooltip()}
							iconName={sortOrderFieldIcon()}
							level={ButtonLevel.Secondary}
							size={props.buttonSize}
							onClick={onSortOrderFieldButtonClick}
						/>
						<Button
							className="sort-order-reverse-button"
							tooltip={CommandService.instance().label('toggleNotesSortOrderReverse')}
							iconName={sortOrderReverseIcon()}
							level={ButtonLevel.Secondary}
							size={props.buttonSize}
							onClick={onSortOrderReverseButtonClick}
						/>
					</div>
				}
			</div>
		</div>
	);
}

interface ConnectProps {
	windowId: string;
}

const mapStateToProps = (state: AppState, ownProps: ConnectProps) => {
	const whenClauseContext = stateToWhenClauseContext(state, { windowId: ownProps.windowId });
	const windowState = stateUtils.windowStateById(state, ownProps.windowId);
	const hasFolderForNewNotes = whenClauseContext.selectedFolderIsValid
		&& windowState.selectedFolderId !== getTrashFolderId();

	return {
		showNewNoteButtons: hasFolderForNewNotes,
		newNoteButtonEnabled: CommandService.instance().isEnabled('newNote', whenClauseContext),
		newTodoButtonEnabled: CommandService.instance().isEnabled('newTodo', whenClauseContext),
		sortOrderButtonsVisible: state.settings['notes.sortOrder.buttonsVisible'],
		sortOrderField: state.settings['notes.sortOrder.field'],
		sortOrderReverse: state.settings['notes.sortOrder.reverse'],
		notesParentType: windowState.notesParentType,
	};
};

export default connect(mapStateToProps)(NoteListControls);
