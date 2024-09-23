import * as React from 'react';

import { StyleSheet, View, TextInput, FlatList, TouchableHighlight } from 'react-native';
import { connect } from 'react-redux';
import ScreenHeader from '../ScreenHeader';
const Icon = require('react-native-vector-icons/Ionicons').default;
import { _ } from '@joplin/lib/locale';
import Note from '@joplin/lib/models/Note';
import NoteItem from '../NoteItem';
import { BaseScreenComponent } from '../base-screen';
import { themeStyle } from '../global-style';
const DialogBox = require('react-native-dialogbox').default;
import SearchEngineUtils from '@joplin/lib/services/search/SearchEngineUtils';
import SearchEngine from '@joplin/lib/services/search/SearchEngine';
import { AppState } from '../../utils/types';
import { NoteEntity } from '@joplin/lib/services/database/types';
import AsyncActionQueue from '@joplin/lib/AsyncActionQueue';
import { Dispatch } from 'redux';

interface Props {
	themeId: number;
	query: string;
	visible: boolean;
	dispatch: Dispatch;

	noteSelectionEnabled: boolean;
	ftsEnabled: number;
}

interface State {
	query: string;
	notes: NoteEntity[];
}

class SearchScreenComponent extends BaseScreenComponent<Props, State> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Partial refactor of old code from before rule was applied.
	public dialogbox: any;

	private isMounted_ = false;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	private styles_: Record<string, any> = {};
	private searchActionQueue_ = new AsyncActionQueue(200);

	public static navigationOptions() {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
		return { header: null } as any;
	}

	public constructor(props: Props) {
		super(props);
		this.state = {
			query: '',
			notes: [],
		};
	}

	public styles() {
		const theme = themeStyle(this.props.themeId);

		if (this.styles_[this.props.themeId]) return this.styles_[this.props.themeId];
		this.styles_ = {};

		const styleSheet = StyleSheet.create({
			body: {
				flex: 1,
			},
			searchContainer: {
				flexDirection: 'row',
				alignItems: 'center',
				borderWidth: 1,
				borderColor: theme.dividerColor,
			},
			searchTextInput: {
				...theme.lineInput,
				paddingLeft: theme.marginLeft,
				flex: 1,
				backgroundColor: theme.backgroundColor,
				color: theme.color,
			},
			clearIcon: {
				...theme.icon,
				color: theme.colorFaded,
				paddingRight: theme.marginRight,
				backgroundColor: theme.backgroundColor,
			},
		});
		this.styles_[this.props.themeId] = styleSheet;
		return styleSheet;
	}

	public componentDidMount() {
		this.setState({ query: this.props.query });
		void this.refreshSearch(this.props.query);
		this.isMounted_ = true;
	}

	public componentWillUnmount() {
		this.isMounted_ = false;
	}

	private clearButton_press() {
		this.props.dispatch({
			type: 'SEARCH_QUERY',
			query: '',
		});

		this.setState({ query: '' });
		void this.refreshSearch('');
	}

	public async refreshSearch(query: string = null) {
		if (!this.props.visible) return;

		let notes: NoteEntity[] = [];

		if (query) {
			if (this.props.ftsEnabled) {
				const r = await SearchEngineUtils.notesForQuery(query, true, { appendWildCards: true });
				notes = r.notes;
			} else {
				const p = query.split(' ');
				const temp = [];
				for (let i = 0; i < p.length; i++) {
					const t = p[i].trim();
					if (!t) continue;
					temp.push(t);
				}

				notes = await Note.previews(null, {
					anywherePattern: `*${temp.join('*')}*`,
				});
			}
		}

		if (!this.isMounted_) return;

		const parsedQuery = await SearchEngine.instance().parseQuery(query);
		const highlightedWords = SearchEngine.instance().allParsedQueryTerms(parsedQuery);

		this.props.dispatch({
			type: 'SET_HIGHLIGHTED',
			words: highlightedWords,
		});

		this.setState({ notes: notes });
	}

	public scheduleSearch() {
		this.searchActionQueue_.push(() => this.refreshSearch(this.state.query));
	}

	public onComponentWillUnmount() {
		void this.searchActionQueue_.reset();
	}

	private searchTextInput_changeText(text: string) {
		this.setState({ query: text });

		this.props.dispatch({
			type: 'SEARCH_QUERY',
			query: text,
		});

		this.scheduleSearch();
	}

	public render() {
		if (!this.isMounted_) return null;

		const theme = themeStyle(this.props.themeId);

		const rootStyle = {
			flex: 1,
			backgroundColor: theme.backgroundColor,
		};

		if (!this.props.visible) {
			rootStyle.flex = 0.001; // This is a bit of a hack but it seems to work fine - it makes the component invisible but without unmounting it
		}

		const thisComponent = this;

		return (
			<View style={rootStyle}>
				<ScreenHeader
					title={_('Search')}
					parentComponent={thisComponent}
					folderPickerOptions={{
						enabled: this.props.noteSelectionEnabled,
						mustSelect: true,
					}}
					showSideMenuButton={false}
					showSearchButton={false}
				/>
				<View style={this.styles().body}>
					<View style={this.styles().searchContainer}>
						<TextInput
							style={this.styles().searchTextInput}
							autoFocus={this.props.visible}
							underlineColorAndroid="#ffffff00"
							onChangeText={text => this.searchTextInput_changeText(text)}
							value={this.state.query}
							selectionColor={theme.textSelectionColor}
							keyboardAppearance={theme.keyboardAppearance}
						/>
						<TouchableHighlight
							onPress={() => this.clearButton_press()}
							accessibilityLabel={_('Clear')}
						>
							<Icon name="close-circle" style={this.styles().clearIcon} />
						</TouchableHighlight>
					</View>

					<FlatList data={this.state.notes} keyExtractor={(item) => item.id} renderItem={event => <NoteItem note={event.item} />} />
				</View>
				<DialogBox
					// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
					ref={(dialogbox: any) => {
						this.dialogbox = dialogbox;
					}}
				/>
			</View>
		);
	}
}

const SearchScreen = connect((state: AppState) => {
	return {
		query: state.searchQuery,
		themeId: state.settings.theme,
		settings: state.settings,
		noteSelectionEnabled: state.noteSelectionEnabled,
		ftsEnabled: state.settings['db.ftsEnabled'],
	};
})(SearchScreenComponent);

export default SearchScreen;
