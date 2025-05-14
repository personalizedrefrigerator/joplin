import { _ } from '@joplin/lib/locale';
import * as React from 'react';
import { View, StyleSheet, useWindowDimensions, TextStyle, Platform, Linking } from 'react-native';
import { Portal, Text } from 'react-native-paper';
import IconButton from './IconButton';
import { useCallback, useMemo, useState } from 'react';
import shim from '@joplin/lib/shim';
import { Dispatch } from 'redux';
import { themeStyle } from './global-style';
import { AppState } from '../utils/types';
import { connect } from 'react-redux';
import Setting from '@joplin/lib/models/Setting';
import { LinkButton } from './buttons';
import Logger from '@joplin/utils/Logger';

const logger = Logger.create('FeedbackBanner');

interface Props {
	dispatch: Dispatch;
	dismissed: boolean;
	surveyKey: string;
	themeId: number;
}

const useStyles = (themeId: number, sentFeedback: boolean) => {
	const { width: windowWidth } = useWindowDimensions();
	return useMemo(() => {
		const theme = themeStyle(themeId);

		const iconBaseStyle: TextStyle = {
			fontSize: 24,
			color: theme.color3,
		};

		return StyleSheet.create({
			container: {
				backgroundColor: theme.backgroundColor3,
				borderTopRightRadius: 16,
				display: 'flex',
				flexGrow: 1,
				flexWrap: 'wrap',
				flexDirection: 'row',
				position: 'absolute',
				bottom: 0,
				left: 0,
				maxWidth: windowWidth - 50,
				gap: 18,
				padding: 12,
			},
			contentRight: {
				display: sentFeedback ? 'none' : 'flex',
				flexDirection: 'row',
				alignItems: 'center',
				gap: 16,
			},
			header: {
				fontWeight: 'bold',
			},
			iconUseful: {
				...iconBaseStyle,
				color: theme.colorCorrect,
			},
			iconNotUseful: {
				...iconBaseStyle,
				color: theme.colorWarn,
			},
			dismissButtonIcon: {
				fontSize: 16,
				color: theme.color2,
				marginLeft: 'auto',
				marginRight: 'auto',
			},
			dismissButton: {
				backgroundColor: theme.backgroundColor2,
				borderColor: theme.backgroundColor,
				borderWidth: 2,
				width: 29,
				height: 29,
				borderRadius: 14,
				position: 'absolute',
				top: -16,
				right: -16,
				justifyContent: 'center',
			},
			dismissButtonContent: {
				flexShrink: 1,
			},
		});
	}, [themeId, windowWidth, sentFeedback]);
};

const useSurveyUrl = (surveyKey: string) => {
	return useMemo(() => {
		let baseUrl = 'https://objects.joplinusercontent.com/';
		if (Setting.value('env') === 'dev') {
			baseUrl = 'http://localhost:3430/';
		}

		return `${baseUrl}survey/${encodeURIComponent(surveyKey)}`;
	}, [surveyKey]);
};

const onDismiss = () => {
	Setting.setValue('survey.webClientEval2025.dismissed', true);
};

const FeedbackBanner: React.FC<Props> = props => {
	const surveyUrl = useSurveyUrl(props.surveyKey);
	const [followUpUrl, setFollowUpUrl] = useState('');
	const sentFeedback = !!followUpUrl;

	const sendSurveyResponse = useCallback(async (surveyResponse: number) => {
		const fetchUrl = `${surveyUrl}?response=${surveyResponse}`;
		logger.debug('sending response to', fetchUrl);
		const showError = (message: string) => {
			logger.error('Error', message);
			void shim.showErrorDialog(_('Error: %s', message));
		};

		try {
			const response = await shim.fetch(fetchUrl);
			if (response.ok) {
				const responseData: unknown = await response.json();
				if (typeof responseData !== 'object') {
					showError(`Server returned an unexpected response: ${JSON.stringify(responseData)}`);
					return;
				} else if (!('surveyUrl' in responseData) || typeof responseData.surveyUrl !== 'string') {
					logger.error('Missing surveyUrl in JSON response:', responseData);
					showError('Server did return a surveyUrl in its response.');
					return;
				}

				setFollowUpUrl(responseData.surveyUrl);
			} else {
				showError(response.statusText);
			}
		} catch (error) {
			showError(`Error: ${error}`);
		}
	}, [surveyUrl]);

	const onSurveyLinkClick = useCallback(() => {
		void Linking.openURL(followUpUrl);
		onDismiss();
	}, [followUpUrl]);

	const onNotUsefulClick = useCallback(() => {
		void sendSurveyResponse(0); // 'not-useful'
	}, [sendSurveyResponse]);

	const onUsefulClick = useCallback(() => {
		void sendSurveyResponse(1); // 'useful'
	}, [sendSurveyResponse]);

	const styles = useStyles(props.themeId, sentFeedback);

	const renderStatusMessage = () => {
		if (sentFeedback) {
			return <View>
				<Text>{_('Thank you for the feedback!\nDo you have time to complete a short survey?')}</Text>
				<LinkButton onPress={onSurveyLinkClick}>{_('Take survey')}</LinkButton>
			</View>;
		} else {
			return <Text>{_('Do you find the Joplin web app useful?')}</Text>;
		}
	};

	if (Platform.OS !== 'web' || props.dismissed) return null;

	return <Portal>
		<View style={styles.container}>
			<View>
				<Text
					accessibilityRole='header'
					variant='titleMedium'
					style={styles.header}
				>{_('Feedback')}</Text>
				<Text>{renderStatusMessage()}</Text>
			</View>
			<View style={styles.contentRight}>
				<IconButton
					iconName='fas times'
					themeId={props.themeId}
					onPress={onNotUsefulClick}
					description={_('Not useful')}
					iconStyle={styles.iconNotUseful}
				/>
				<IconButton
					iconName='fas check'
					themeId={props.themeId}
					onPress={onUsefulClick}
					description={_('Useful')}
					iconStyle={styles.iconUseful}
				/>
			</View>
			<IconButton
				iconName='fas times'
				themeId={props.themeId}
				onPress={onDismiss}
				description={_('Dismiss')}
				iconStyle={styles.dismissButtonIcon}
				contentWrapperStyle={styles.dismissButtonContent}
				containerStyle={styles.dismissButton}
			/>
		</View>
	</Portal>;
};

export default connect((state: AppState) => ({
	themeId: state.settings.theme,
	surveyKey: 'web-app-test',
	dismissed: state.settings['survey.webClientEval2025.dismissed'],
}))(FeedbackBanner);
