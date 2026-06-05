import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';

import { View, Button, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { AppState } from '../../utils/types';
import { connect } from 'react-redux';
import { ScreenHeader } from '../ScreenHeader';
import { _ } from '@joplin/lib/locale';
import Shared from '@joplin/lib/components/shared/dropbox-login-shared';
import shim, { MessageBoxType } from '@joplin/lib/shim';
import { themeStyle } from '../global-style';
import { Dispatch } from 'redux';

interface Props {
	themeId: number;
	dispatch: Dispatch;
}

interface State {
	loginUrl: string;
	authCode: string;
	checkingAuthToken: boolean;
}

// Adapter that lets the shared (class-oriented) helper drive this function
// component's state via the same `props`/`state`/`setState` interface a class
// would expose. `state` is kept synchronously current because the helper reads
// it directly between renders.
interface Host {
	props: { dispatch: Dispatch };
	state: State;
	setState: (state: Partial<State>)=> void;
}

const useStyles = (themeId: number) => {
	return useMemo(() => {
		const theme = themeStyle(themeId);
		return StyleSheet.create({
			screen: {
				flex: 1,
				backgroundColor: theme.backgroundColor,
			},
			container: {
				padding: theme.margin,
				backgroundColor: theme.backgroundColor,
			},
			stepText: { ...theme.normalText, marginBottom: theme.margin },
			urlText: { ...theme.urlText, marginBottom: theme.margin },
		});
	}, [themeId]);
};

const DropboxLoginScreenComponent: React.FC<Props> = props => {
	const { themeId, dispatch } = props;

	const [state, setState] = useState<State>({
		loginUrl: '',
		authCode: '',
		checkingAuthToken: false,
	});

	const shared = useMemo(() => {
		const host: Host = {
			props: { dispatch },
			state: { loginUrl: '', authCode: '', checkingAuthToken: false },
			setState: partial => {
				host.state = { ...host.state, ...partial };
				setState(prevState => ({ ...prevState, ...partial }));
			},
		};

		return new Shared(
			host,
			(msg: string) => shim.showMessageBox(msg, { type: MessageBoxType.Info }),
			(msg: string) => shim.showErrorDialog(msg),
		);
	}, [dispatch]);

	useEffect(() => {
		void shared.refreshUrl();
	}, [shared]);

	const styles = useStyles(themeId);
	const theme = themeStyle(themeId);

	return (
		<View style={styles.screen}>
			<ScreenHeader title={_('Login with Dropbox')} />

			<ScrollView style={styles.container}>
				<Text style={styles.stepText}>{_('To allow Joplin to synchronise with Dropbox, please follow the steps below:')}</Text>
				<Text style={styles.stepText}>{_('Step 1: Open this URL in your browser to authorise the application:')}</Text>
				<View>
					<TouchableOpacity onPress={shared.loginUrl_click}>
						<Text style={styles.urlText}>{state.loginUrl}</Text>
					</TouchableOpacity>
				</View>
				<Text style={styles.stepText}>{_('Step 2: Enter the code provided by Dropbox:')}</Text>
				<TextInput placeholder={_('Enter code here')} placeholderTextColor={theme.colorFaded} selectionColor={theme.textSelectionColor} keyboardAppearance={theme.keyboardAppearance} value={state.authCode} onChangeText={shared.authCodeInput_change} style={theme.lineInput} />
				<View style={{ height: 10 }}></View>
				<Button disabled={state.checkingAuthToken} title={_('Submit')} onPress={shared.submit_click}></Button>

				{/* Add this extra padding to make sure the view is scrollable when the keyboard is visible on small screens (iPhone SE) */}
				<View style={{ height: 200 }}></View>
			</ScrollView>
		</View>
	);
};

const DropboxLoginScreen = connect((state: AppState) => {
	return {
		themeId: state.settings.theme,
	};
})(DropboxLoginScreenComponent);

export default DropboxLoginScreen;
