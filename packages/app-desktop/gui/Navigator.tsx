import * as React from 'react';
const { connect } = require('react-redux');
import Setting from '@joplin/lib/models/Setting';
import { AppState, AppStateRoute } from '../app.reducer';
import bridge from '../services/bridge';
import { useContext, useEffect, useRef } from 'react';
import { WindowIdContext } from './NewWindowOrIFrame';

interface Props {
	route: AppStateRoute;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	screens: Record<string, any>;

	style: React.CSSProperties;
	className?: string;
}

const NavigatorComponent: React.FC<Props> = props => {
	const windowId = useContext(WindowIdContext);

	const route = props.route;
	const screenInfo = props.screens[route?.routeName];

	const screensRef = useRef(props.screens);
	screensRef.current = props.screens;

	const prevRoute = useRef<AppStateRoute|null>(null);
	useEffect(() => {
		const routeName = route?.routeName;
		if (route) {
			const devMarker = Setting.value('env') === 'dev' ? ` (DEV - ${Setting.value('profileDir')})` : '';
			const windowTitle = [`Joplin${devMarker}`];
			if (screenInfo.title) {
				windowTitle.push(screenInfo.title());
			}
			bridge().windowById(windowId)?.setTitle(windowTitle.join(' - '));
		}

		// When a navigation happens in an unfocused window, show the window to the user.
		// This might happen if, for example, a secondary window triggers a navigation in
		// the main window.
		if (routeName && routeName !== prevRoute.current?.routeName) {
			bridge().switchToWindow(windowId);
		}

		prevRoute.current = route;
	}, [route, screenInfo, windowId]);

	if (!route) throw new Error('Route must not be null');

	const screenProps = route.props ? route.props : {};
	const Screen = screenInfo.screen;

	const screenStyle = {
		width: props.style.width,
		height: props.style.height,
	};

	return (
		<div style={props.style} className={props.className}>
			<Screen style={screenStyle} {...screenProps} />
		</div>
	);
};

const Navigator = connect((state: AppState) => {
	return {
		route: state.route,
	};
})(NavigatorComponent);

export default Navigator;
