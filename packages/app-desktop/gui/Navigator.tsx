import * as React from 'react';
const { connect } = require('react-redux');
import Setting from '@joplin/lib/models/Setting';
import { AppState } from '../app.reducer';
import bridge from '../services/bridge';
import { focus } from '@joplin/lib/utils/focusHandler';

interface Props {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	route: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	screens: Record<string, any>;

	style: React.CSSProperties;
	className?: string;
}

class NavigatorComponent extends React.Component<Props> {
	public override componentDidUpdate(prevProps: Props): void {
		if (this.props.route) {
			const routeName = this.props.route.routeName;
			const screenInfo = this.props.screens[routeName];
			const devMarker = Setting.value('env') === 'dev' ? ` (DEV - ${Setting.value('profileDir')})` : '';
			const windowTitle = [`Joplin${devMarker}`];
			if (screenInfo.title) {
				windowTitle.push(screenInfo.title());
			}
			this.updateWindowTitle(windowTitle.join(' - '));

			if (prevProps.route.routeName && routeName !== prevProps.route.routeName) {
				if (bridge().hasActiveWindow() && bridge().activeWindow() !== bridge().mainWindow()) {
					focus('Navigator', bridge().mainWindow());
				}
			}
		}
	}

	public updateWindowTitle(title: string) {
		try {
			if (bridge().mainWindow()) bridge().mainWindow().setTitle(title);
		} catch (error) {
			console.warn('updateWindowTitle', error);
		}
	}

	public render() {
		if (!this.props.route) throw new Error('Route must not be null');

		const route = this.props.route;
		const screenProps = route.props ? route.props : {};
		const screenInfo = this.props.screens[route.routeName];
		const Screen = screenInfo.screen;

		const screenStyle = {
			width: this.props.style.width,
			height: this.props.style.height,
		};

		return (
			<div style={this.props.style} className={this.props.className}>
				<Screen style={screenStyle} {...screenProps} />
			</div>
		);
	}
}

const Navigator = connect((state: AppState) => {
	return {
		route: state.route,
	};
})(NavigatorComponent);

export default Navigator;
