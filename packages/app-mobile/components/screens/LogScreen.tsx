import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { FlatList, View, Text, Button, StyleSheet, Platform } from 'react-native';
import { connect } from 'react-redux';
import { reg } from '@joplin/lib/registry';
import { ScreenHeader } from '../ScreenHeader';
import time from '@joplin/lib/time';
import { themeStyle } from '../global-style';
import Logger, { LogEntry } from '@joplin/utils/Logger';
import { _ } from '@joplin/lib/locale';
import { MenuOptionType } from '../ScreenHeader';
import { AppState } from '../../utils/types';
import { writeTextToCacheFile } from '../../utils/ShareUtils';
import shim from '@joplin/lib/shim';
import { TextInput } from 'react-native-paper';
import shareFile from '../../utils/shareFile';
import createRootStyle from '../../utils/createRootStyle';

const logger = Logger.create('LogScreen');

const getLogLevels = (showErrorsOnly: boolean) => {
	let levels = [Logger.LEVEL_DEBUG, Logger.LEVEL_INFO, Logger.LEVEL_WARN, Logger.LEVEL_ERROR];
	if (showErrorsOnly) levels = [Logger.LEVEL_WARN, Logger.LEVEL_ERROR];

	return levels;
};

const formatLogEntry = (item: LogEntry) => {
	return `${time.formatMsToLocal(item.timestamp, 'MM-DDTHH:mm:ss')}: ${item.message}`;
};

interface Props {
	themeId: number;
	navigation: { state: { defaultFilter?: string } };
}

const useStyles = (themeId: number) => {
	return useMemo(() => {
		const theme = themeStyle(themeId);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Heterogeneous style entries (row + rowText, then rowTextError/Warn spread off rowText); typed split would force restructuring
		const styles: Record<string, any> = {
			row: {
				flexDirection: 'row',
				paddingLeft: 1,
				paddingRight: 1,
				paddingTop: 0,
				paddingBottom: 0,
			},
			rowText: {
				fontSize: 10,
				color: theme.color,
			},
		};

		if (Platform.OS !== 'ios') {
			// Crashes on iOS with error "Unrecognized font family 'monospace'"
			styles.rowText.fontFamily = 'monospace';
		}

		styles.rowTextError = { ...styles.rowText };
		styles.rowTextError.color = theme.colorError;

		styles.rowTextWarn = { ...styles.rowText };
		styles.rowTextWarn.color = theme.colorWarn;

		return StyleSheet.create(styles);
	}, [themeId]);
};

const LogScreenComponent: React.FC<Props> = props => {
	const { themeId, navigation } = props;

	const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
	const [showErrorsOnly, setShowErrorsOnly] = useState(false);
	const [filter, setFilter] = useState<string|undefined>(undefined);

	const logListRef = useRef<FlatList>(null);

	// Refs let the async refresh logic read the latest filter/showErrorsOnly without stale closures.
	const filterRef = useRef(filter);
	filterRef.current = filter;
	const showErrorsOnlyRef = useRef(showErrorsOnly);
	showErrorsOnlyRef.current = showErrorsOnly;

	const styles = useStyles(themeId);
	const rootStyle = useMemo(() => createRootStyle(themeId), [themeId]);

	const getLogEntries = useCallback(async (errorsOnly: boolean, limit: number|null = null): Promise<LogEntry[]> => {
		const levels = getLogLevels(errorsOnly);
		return await reg.logger().lastEntries(limit, { levels, filter: filterRef.current });
	}, []);

	// Scroll to the top after the entries refreshed, mirroring the old setState callback.
	const pendingScrollToTopRef = useRef(false);
	useEffect(() => {
		if (pendingScrollToTopRef.current) {
			pendingScrollToTopRef.current = false;
			logListRef.current?.scrollToOffset({ offset: 0, animated: false });
		}
	}, [logEntries]);

	const refreshLogEntries = useCallback(async (newShowErrorsOnly: boolean = null) => {
		const effectiveShowErrorsOnly = newShowErrorsOnly === null ? showErrorsOnlyRef.current : newShowErrorsOnly;
		const prevShowErrorsOnly = showErrorsOnlyRef.current;

		const limit = 1000;
		const entries = await getLogEntries(effectiveShowErrorsOnly, limit);

		if (filterRef.current !== undefined || prevShowErrorsOnly !== effectiveShowErrorsOnly) {
			pendingScrollToTopRef.current = true;
		}
		setLogEntries(entries);
		setShowErrorsOnly(effectiveShowErrorsOnly);
	}, [getLogEntries]);

	const defaultFilter = navigation.state.defaultFilter;
	useEffect(() => {
		void refreshLogEntries();

		if (defaultFilter) {
			setFilter(defaultFilter);
		}
	}, [refreshLogEntries, defaultFilter]);

	// Refresh the log only after a brief delay -- this prevents the log from updating
	// with every keystroke in the filter input.
	const isFirstRender = useRef(true);
	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false;
			return undefined;
		}

		const timeout = setTimeout(() => {
			void refreshLogEntries();
		}, 600);
		return () => clearTimeout(timeout);
	}, [filter, refreshLogEntries]);

	const onSharePress = useCallback(async () => {
		const allEntries = await getLogEntries(showErrorsOnlyRef.current);
		const logData = allEntries.map(entry => formatLogEntry(entry)).join('\n');

		let fileToShare;
		try {
			// Using a .txt file extension causes a "No valid provider found from URL" error
			// and blank share sheet on iOS for larger log files (around 200 KiB).
			fileToShare = await writeTextToCacheFile(logData, 'mobile-log.log');
			await shareFile(fileToShare, 'text/plain');
		} catch (e) {
			logger.error('Unable to share log data:', e);

			// Display a message to the user (e.g. in the case where the user is out of disk space).
			void shim.showErrorDialog(_('Unable to share log data. Reason: %s', e.toString()));
		} finally {
			if (fileToShare) {
				await shim.fsDriver().remove(fileToShare);
			}
		}
	}, [getLogEntries]);

	const menuOptions = useMemo<MenuOptionType[]>(() => [
		{
			title: _('Share'),
			onPress: () => {
				void onSharePress();
			},
		},
	], [onSharePress]);

	const onRenderLogRow = useCallback(({ item }: { item: LogEntry }) => {
		let textStyle = styles.rowText;
		if (item.level === Logger.LEVEL_WARN) textStyle = styles.rowTextWarn;
		if (item.level === Logger.LEVEL_ERROR) textStyle = styles.rowTextError;

		return (
			<View style={styles.row}>
				<Text style={textStyle}>{formatLogEntry(item)}</Text>
			</View>
		);
	}, [styles]);

	const onToggleFilterInput = useCallback(() => {
		setFilter(prevFilter => prevFilter === undefined ? '' : undefined);
	}, []);

	const filterInput = (
		<TextInput
			value={filter}
			onChangeText={setFilter}
			label={_('Filter')}
			placeholder={_('Filter')}
		/>
	);

	return (
		<View style={rootStyle.root}>
			<ScreenHeader
				title={_('Log')}
				menuOptions={menuOptions}
				showSearchButton={true}
				onSearchButtonPress={onToggleFilterInput}/>
			{filter !== undefined ? filterInput : null}
			<FlatList
				ref={logListRef}
				data={logEntries}
				initialNumToRender={100}
				renderItem={onRenderLogRow}
				keyExtractor={item => { return `${item.id}`; }}
			/>
			<View style={{ flexDirection: 'row' }}>
				<View style={{ flex: 1, marginRight: 5 }}>
					<Button
						title={_('Refresh')}
						onPress={() => {
							void refreshLogEntries();
						}}
					/>
				</View>
				<View style={{ flex: 1 }}>
					<Button
						title={showErrorsOnly ? _('Show all') : _('Errors only')}
						onPress={() => {
							void refreshLogEntries(!showErrorsOnlyRef.current);
						}}
					/>
				</View>
			</View>
		</View>
	);
};

const LogScreen = connect((state: AppState) => {
	return {
		themeId: state.settings.theme,
	};
})(LogScreenComponent);

export default LogScreen;
