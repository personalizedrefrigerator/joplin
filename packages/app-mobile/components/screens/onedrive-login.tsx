import * as React from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { View, Button, StyleSheet } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { connect } from 'react-redux';
import { ScreenHeader } from '../ScreenHeader';
import { reg } from '@joplin/lib/registry';
import { _ } from '@joplin/lib/locale';
import { themeStyle } from '../global-style';
import shim from '@joplin/lib/shim';
import { AppState } from '../../utils/types';
import { Dispatch } from 'redux';

interface Props {
	themeId: number;
	dispatch: Dispatch;
}

// Minimal view of the OneDrive sync target API used by this screen.
interface OneDriveApi {
	authCodeUrl(redirectUrl: string): string;
	nativeClientRedirectUrl(): string;
	execTokenRequest(code: string, redirectUrl: string): Promise<void>;
}

const oneDriveApi = (): OneDriveApi => reg.syncTarget().api();
const redirectUrl = () => oneDriveApi().nativeClientRedirectUrl();
const startUrl = () => oneDriveApi().authCodeUrl(redirectUrl());

const authCodeFromUrl = (url: string) => {
	if (!url) return null;
	try {
		return new URL(url).searchParams.get('code');
	} catch (error) {
		return null;
	}
};

const useStyles = (themeId: number) => {
	return useMemo(() => {
		const theme = themeStyle(themeId);
		return StyleSheet.create({
			screen: {
				flex: 1,
				backgroundColor: theme.backgroundColor,
			},
		});
	}, [themeId]);
};

const OneDriveLoginScreenComponent: React.FC<Props> = props => {
	const { themeId, dispatch } = props;

	const [webviewUrl, setWebviewUrl] = useState<string>(() => startUrl());
	const authCodeRef = useRef<string | null>(null);

	const styles = useStyles(themeId);

	const webview_load = useCallback(async (event: WebViewNavigation) => {
		// This is deprecated according to the doc but since the non-deprecated property (source)
		// doesn't exist, use this for now. The whole component is completely undocumented
		// at the moment so it's likely to change.
		const url = event.url;
		const authCode = authCodeFromUrl(url);

		if (!authCodeRef.current && authCode) {
			authCodeRef.current = authCode;

			try {
				await oneDriveApi().execTokenRequest(authCodeRef.current, redirectUrl());
				dispatch({ type: 'NAV_BACK' });
				void reg.scheduleSync(0);
			} catch (error) {
				alert(`Could not login to OneDrive. Please try again\n\n${error.message}\n\n${url}`);
			}

			authCodeRef.current = null;
		}
	}, [dispatch]);

	const webview_error = useCallback(() => {
		alert('Could not load page. Please check your connection and try again.');
	}, []);

	const retryButton_click = useCallback(() => {
		// It seems the only way it would reload the page is by loading an unrelated
		// URL, waiting a bit, and then loading the actual URL. There's probably
		// a better way to do this.
		setWebviewUrl('https://microsoft.com');

		shim.setTimeout(() => {
			setWebviewUrl(startUrl());
		}, 1000);
	}, []);

	const source = {
		uri: webviewUrl,
	};

	return (
		<View style={styles.screen}>
			<ScreenHeader title={_('Login with OneDrive')} />
			<WebView
				source={source}
				onNavigationStateChange={event => { void webview_load(event); }}
				onError={webview_error}
			/>
			<Button
				title={_('Refresh')}
				onPress={retryButton_click}
			/>
		</View>
	);
};

const OneDriveLoginScreen = connect((state: AppState) => {
	return {
		themeId: state.settings.theme,
	};
})(OneDriveLoginScreenComponent);

export default OneDriveLoginScreen;
