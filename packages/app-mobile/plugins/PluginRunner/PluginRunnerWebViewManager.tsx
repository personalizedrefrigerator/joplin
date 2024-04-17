
import * as React from 'react';
import { useMemo, useRef, useState } from 'react';
import PluginRunner from './PluginRunner';
import loadPlugins from '../loadPlugins';
import { connect, useStore } from 'react-redux';
import Logger from '@joplin/utils/Logger';
import { View } from 'react-native';
import PluginService, { PluginSettings } from '@joplin/lib/services/plugins/PluginService';
import { PluginHtmlContents, PluginStates } from '@joplin/lib/services/plugins/reducer';
import useAsyncEffect from '@joplin/lib/hooks/useAsyncEffect';
import PluginDialogManager from './dialogs/PluginDialogManager';
import { AppState } from '../../utils/types';
import PluginRunnerWebView from './PluginRunnerWebView';
import Plugin from '@joplin/lib/services/plugins/Plugin';

const logger = Logger.create('PluginRunnerWebViewManager');

const usePluginSettings = (serializedPluginSettings: string) => {
	return useMemo(() => {
		const pluginService = PluginService.instance();
		return pluginService.unserializePluginSettings(serializedPluginSettings);
	}, [serializedPluginSettings]);
};

const usePlugins = (
	pluginRunner: PluginRunner,
	pluginSettings: PluginSettings,
) => {
	const store = useStore();

	useAsyncEffect(async (event) => {
		void loadPlugins(pluginRunner, pluginSettings, store, event);
	}, [pluginRunner, store, pluginSettings]);
};


interface Props {
	serializedPluginSettings: string;
	pluginStates: PluginStates;
	pluginHtmlContents: PluginHtmlContents;
	themeId: number;
}

const PluginRunnerWebViewComponent: React.FC<Props> = props => {
	const [ runningPlugins, setRunningPlugins ] = useState<Plugin[]>([]);

	const runningPluginsRef = useRef(runningPlugins);
	runningPluginsRef.current = runningPlugins;

	const pluginRunner = useMemo(() => {
		const onAddPlugin = (plugin: Plugin) => {
			if (!runningPluginsRef.current.includes(plugin)) {
				logger.debug(`Adding plugin: ${plugin.id}`);
				setRunningPlugins([ ...runningPluginsRef.current, plugin ]);
			}
		};
		const onRemovePlugin = (plugin: Plugin) => {
			logger.debug(`Removing plugin: ${plugin.id}`);
			setRunningPlugins(runningPluginsRef.current.filter(other => other !== plugin));
		};
		return new PluginRunner(onAddPlugin, onRemovePlugin);
	}, []);

	const pluginSettings = usePluginSettings(props.serializedPluginSettings);
	usePlugins(pluginRunner, pluginSettings);

	const pluginWebViews: React.ReactNode[] = [];
	for (const plugin of runningPlugins) {
		pluginWebViews.push(
			<PluginRunnerWebView key={plugin.id} plugin={plugin} pluginRunner={pluginRunner}/>
		);
	}

	const renderDialogManager = () => {
		const hasPlugins = Object.values(pluginSettings).length > 0;
		if (!hasPlugins) return null;
		return (
			<PluginDialogManager
				key='dialog-manager'
				themeId={props.themeId}
				pluginHtmlContents={props.pluginHtmlContents}
				pluginStates={props.pluginStates}
			/>
		);
	};

	return (
		<View style={{ display: 'none' }}>
			{pluginWebViews}
			{renderDialogManager()}
		</View>
	);
};

export default connect((state: AppState) => {
	const result: Props = {
		serializedPluginSettings: state.settings['plugins.states'],
		pluginStates: state.pluginService.plugins,
		pluginHtmlContents: state.pluginService.pluginHtmlContents,
		themeId: state.settings.theme,
	};
	return result;
})(PluginRunnerWebViewComponent);
