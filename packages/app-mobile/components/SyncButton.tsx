import * as React from 'react';
import { AppState } from '../utils/types';
import { connect } from 'react-redux';
import type { Dispatch } from 'redux';
import { useEffect, useMemo, useCallback, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SyncReport } from '@joplin/lib/services/synchronizer/utils/types';
import Synchronizer from '@joplin/lib/Synchronizer';
import { StateDecryptionWorker, StateResourceFetcher } from '@joplin/lib/reducer';
import { _ } from '@joplin/lib/locale';
import { themeStyle } from './global-style';
import Icon from './Icon';
import Setting from '@joplin/lib/models/Setting';
import { reg } from '@joplin/lib/registry';

interface Props {
	dispatch: Dispatch;
	themeId: number;
	syncStarted: boolean;
	syncReport: SyncReport;
	decryptionWorker: StateDecryptionWorker;
	resourceFetcher: StateResourceFetcher;
	syncOnlyOverWifi: boolean;
	isOnMobileData: boolean;
}

const useSyncIconRotation = (syncStarted: boolean) => {
	const [syncIconRotationValue] = useState(() => new Animated.Value(0));
	const syncIconAnimation = useRef<Animated.CompositeAnimation|null>(null);

	useEffect(() => {
		if (syncStarted) {
			syncIconAnimation.current = Animated.loop(
				Animated.timing(syncIconRotationValue, {
					toValue: 1,
					duration: 3000,
					easing: Easing.linear,
					useNativeDriver: false,
				}),
			);

			syncIconAnimation.current.start();
		} else {
			syncIconAnimation.current?.stop();
			syncIconAnimation.current = null;
		}
	}, [syncStarted, syncIconRotationValue]);

	const syncIconRotation = useMemo(() => {
		return syncIconRotationValue.interpolate({
			inputRange: [0, 1],
			outputRange: ['0deg', '360deg'],
		});
	}, [syncIconRotationValue]);

	return syncIconRotation;
};

const useStyles = (themeId: number, rotation: Animated.AnimatedNode) => {
	return useMemo(() => {
		const theme = themeStyle(themeId);
		return StyleSheet.create({
			syncStatus: {
				paddingLeft: theme.marginLeft,
				paddingRight: theme.marginRight,
				color: theme.colorFaded,
				fontSize: theme.fontSizeSmaller,
				flex: 0,
			},
			syncIconContainer: { transform: [{ rotate: rotation }] },
			syncIconContent: {
				fontSize: 22,
				color: theme.color,
				width: 26,
				textAlign: 'center',
				textAlignVertical: 'center',
			},
			syncButton: {
				flex: 0,
				flexDirection: 'row',
				flexBasis: 'auto',
				height: 36,
				alignItems: 'center',
				paddingLeft: theme.marginLeft,
				paddingRight: theme.marginRight,
			},
			syncButtonText: {
				flex: 1,
				color: theme.color,
				paddingLeft: 10,
				fontSize: theme.fontSize,
			},
		});
	}, [themeId, rotation]);
};

const useOnSyncPress = (syncStarted: boolean, dispatch: Dispatch) => {
	const performSync = useCallback(async () => {
		const action = syncStarted ? 'cancel' : 'start';

		if (!Setting.value('sync.target')) {
			dispatch({
				type: 'SIDE_MENU_CLOSE',
			});

			dispatch({
				type: 'NAV_GO',
				routeName: 'Config',
				sectionName: 'sync',
			});

			return 'init';
		}

		if (!(await reg.syncTarget().isAuthenticated())) {
			if (reg.syncTarget().authRouteName()) {
				dispatch({
					type: 'NAV_GO',
					routeName: reg.syncTarget().authRouteName(),
				});
				return 'auth';
			}

			reg.logger().error('Not authenticated with sync target - please check your credentials.');
			return 'error';
		}

		let sync = null;
		try {
			sync = await reg.syncTarget().synchronizer();
		} catch (error) {
			reg.logger().error('Could not initialise synchroniser: ');
			reg.logger().error(error);
			error.message = `Could not initialise synchroniser: ${error.message}`;
			dispatch({
				type: 'SYNC_REPORT_UPDATE',
				report: { errors: [error] },
			});
			return 'error';
		}

		if (action === 'cancel') {
			void sync.cancel();
			return 'cancel';
		} else {
			void reg.scheduleSync(0);
			return 'sync';
		}
	}, [syncStarted, dispatch]);

	return useCallback(async () => {
		const actionDone = await performSync();
		if (actionDone === 'auth') dispatch({ type: 'SIDE_MENU_CLOSE' });
	}, [performSync, dispatch]);
};

const useSyncReportLines = (syncReport: SyncReport, decryptionWorker: StateDecryptionWorker, resourceFetcher: StateResourceFetcher) => {
	const lines = Synchronizer.reportToLines(syncReport);
	const syncReportText = lines.join('\n');

	let decryptionReportText = '';
	if (decryptionWorker && decryptionWorker.state !== 'idle' && decryptionWorker.itemCount) {
		decryptionReportText = _('Decrypting items: %d/%d', decryptionWorker.itemIndex + 1, decryptionWorker.itemCount);
	}

	let resourceFetcherText = '';
	if (resourceFetcher && resourceFetcher.toFetchCount) {
		resourceFetcherText = _('Fetching resources: %d/%d', resourceFetcher.fetchingCount, resourceFetcher.toFetchCount);
	}

	const fullReport = [];
	if (syncReportText) fullReport.push(syncReportText);
	if (resourceFetcherText) fullReport.push(resourceFetcherText);
	if (decryptionReportText) fullReport.push(decryptionReportText);

	return fullReport.join('\n');
};

const SyncButton: React.FC<Props> = props => {

	const syncIconRotation = useSyncIconRotation(props.syncStarted);
	const styles = useStyles(props.themeId, syncIconRotation);

	const items = [];

	const fullReport = useSyncReportLines(props.syncReport, props.decryptionWorker, props.resourceFetcher);
	if (fullReport.length) {
		items.push(
			<Text key="sync_report" style={styles.syncStatus}>
				{fullReport}
			</Text>,
		);
	}

	const onSyncPress = useOnSyncPress(props.syncStarted, props.dispatch);
	items.push(
		<TouchableOpacity
			key='sync_button'
			style={styles.syncButton}
			onPress={onSyncPress}
		>
			<Animated.View style={styles.syncIconContainer}>
				<Icon
					name='ionicon sync'
					style={styles.syncIconContent}
					accessibilityLabel={null}
				/>
			</Animated.View>
			<Text style={styles.syncButtonText}>{!props.syncStarted ? _('Synchronise') : _('Cancel')}</Text>
		</TouchableOpacity>,
	);

	if (props.syncOnlyOverWifi && props.isOnMobileData) {
		items.push(
			<Text key="net_info" style={styles.syncStatus}>
				{ _('Mobile data - auto-sync disabled') }
			</Text>,
		);
	}

	return <>
		{items}
	</>;
};

export default connect((state: AppState) => ({
	themeId: state.settings.theme,
	syncStarted: state.syncStarted,
	syncReport: state.syncReport,
	decryptionWorker: state.decryptionWorker,
	resourceFetcher: state.resourceFetcher,
	isOnMobileData: state.isOnMobileData,
	syncOnlyOverWifi: state.settings['sync.mobileWifiOnly'],
}))(SyncButton);
