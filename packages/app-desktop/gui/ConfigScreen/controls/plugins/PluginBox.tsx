import * as React from 'react';
import { useCallback, useId, useMemo } from 'react';
import { _ } from '@joplin/lib/locale';
import ToggleButton from '../../../lib/ToggleButton/ToggleButton';
import Button, { ButtonLevel } from '../../../Button/Button';
import { PluginManifest } from '@joplin/lib/services/plugins/utils/types';
import bridge from '../../../../services/bridge';
import { ItemEvent, PluginItem } from '@joplin/lib/components/shared/config/plugins/types';
import PluginService from '@joplin/lib/services/plugins/PluginService';
import getPluginHelpUrl from '@joplin/lib/services/plugins/utils/getPluginHelpUrl';

export enum InstallState {
	NotInstalled = 1,
	Installing = 2,
	Installed = 3,
}

export enum UpdateState {
	Idle = 1,
	CanUpdate = 2,
	Updating = 3,
	HasBeenUpdated = 4,
}

interface Props {
	item?: PluginItem;
	manifest?: PluginManifest;
	installState?: InstallState;
	updateState?: UpdateState;
	themeId: number;
	isCompatible: boolean;
	onToggle?: (event: ItemEvent)=> void;
	onDelete?: (event: ItemEvent)=> void;
	onInstall?: (event: ItemEvent)=> void;
	onUpdate?: (event: ItemEvent)=> void;
}

function manifestToItem(manifest: PluginManifest): PluginItem {
	return {
		manifest: manifest,
		installed: true,
		enabled: true,
		deleted: false,
		devMode: false,
		builtIn: false,
		hasBeenUpdated: false,
	};
}

export default function(props: Props) {
	const item = useMemo(() => {
		return props.item ? props.item : manifestToItem(props.manifest);
	}, [props.item, props.manifest]);

	const onNameClick = useCallback(() => {
		const manifest = item.manifest;
		void bridge().openExternal(getPluginHelpUrl(manifest.id));
	}, [item]);

	const onRecommendedClick = useCallback(() => {
		void bridge().openExternal('https://github.com/joplin/plugins/blob/master/readme/recommended.md#recommended-plugins');
	}, []);

	// For plugins in dev mode things like enabling/disabling or
	// uninstalling them doesn't make sense, as that should be done by
	// adding/removing them from wherever they were loaded from.

	function renderToggleButton() {
		if (!props.onToggle) return null;

		if (item.devMode) {
			return <div className='plugin-boxed-label'>DEV</div>;
		}

		return <ToggleButton
			themeId={props.themeId}
			value={item.enabled}
			onToggle={() => props.onToggle({ item })}
			aria-label={item.enabled ? _('Disable %s', item.manifest.name) : _('Enable %s', item.manifest.name)}
		/>;
	}

	function renderDeleteButton() {
		// Built-in plugins can only be disabled
		if (item.builtIn) return null;
		if (!props.onDelete) return null;

		return <Button level={ButtonLevel.Secondary} onClick={() => props.onDelete({ item })} title={_('Delete')}/>;
	}

	function renderInstallButton() {
		if (!props.onInstall) return null;

		let title = _('Install');
		if (props.installState === InstallState.Installing) title = _('Installing...');
		if (props.installState === InstallState.Installed) title = _('Installed');

		return <Button
			level={ButtonLevel.Secondary}
			disabled={props.installState !== InstallState.NotInstalled}
			onClick={() => props.onInstall({ item })}
			title={title}
		/>;
	}

	function renderUpdateButton() {
		if (!props.onUpdate) return null;

		let title = _('Update');
		if (props.updateState === UpdateState.Updating) title = _('Updating...');
		if (props.updateState === UpdateState.Idle) title = _('Updated');
		if (props.updateState === UpdateState.HasBeenUpdated) title = _('Updated');

		return <Button
			className='update'
			level={ButtonLevel.Recommended}
			onClick={() => props.onUpdate({ item })}
			title={title}
			disabled={props.updateState === UpdateState.HasBeenUpdated}
		/>;
	}

	const renderDefaultPluginLabel = () => {
		if (item.builtIn) {
			return (
				<div className='plugin-boxed-label'>{_('Built-in')}</div>
			);
		}

		return null;
	};

	function renderFooter() {
		if (item.devMode) return null;

		if (!props.isCompatible) {
			return (
				<div className='footer'>
					<span className='plugin-upgrade-message'>
						{PluginService.instance().describeIncompatibility(item.manifest)}
					</span>
				</div>
			);
		}

		return (
			<div className='footer'>
				{renderDeleteButton()}
				{renderInstallButton()}
				{renderUpdateButton()}
				<div style={{ display: 'flex', flex: 1 }}/>
				{renderDefaultPluginLabel()}
			</div>
		);
	}

	function renderRecommendedBadge() {
		if (props.onToggle) return null;
		if (!item.manifest._recommended) return null;
		return <a className='recommended-badge' href="#" title={_('The Joplin team has vetted this plugin and it meets our standards for security and performance.')} onClick={onRecommendedClick}><i className="fas fa-crown"></i></a>;
	}

	const nameLabelId = useId();

	return (
		<div className={`plugin-box${props.isCompatible ? '' : ' -incompatible'}`} role='group' aria-labelledby={nameLabelId}>
			<div className='top'>
				<div className='plugin-name-version'>
					<a className='name' onClick={onNameClick} href="#" id={nameLabelId}>
						{item.manifest.name} {item.deleted ? _('(%s)', 'Deleted') : ''}
					</a>
					<span className='version'>v{item.manifest.version}</span>
				</div>
				{renderToggleButton()}
				{renderRecommendedBadge()}
			</div>
			<div className='content'>
				<div className='plugin-description'>{item.manifest.description}</div>
			</div>
			{renderFooter()}
		</div>
	);
}
