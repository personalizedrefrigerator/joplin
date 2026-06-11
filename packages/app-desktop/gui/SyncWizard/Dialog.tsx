import * as React from 'react';
import { Dispatch } from 'redux';
import { useRef, useCallback, useId } from 'react';
import { _ } from '@joplin/lib/locale';
import DialogButtonRow from '../DialogButtonRow';
import Dialog from '@joplin/lib/components/Dialog';
import DialogTitle from '../DialogTitle';
import SyncTargetRegistry, { SyncTargetInfo } from '@joplin/lib/SyncTargetRegistry';
import useElementSize from '@joplin/lib/hooks/useElementSize';
import Button, { ButtonLevel } from '../Button/Button';
import bridge from '../../services/bridge';
import Setting from '@joplin/lib/models/Setting';
import JoplinCloudSignUpCallToAction from '../JoplinCloudSignUpCallToAction';

interface Props {
	themeId: number;
	dispatch: Dispatch;
}

const syncTargetNames: string[] = [
	'joplinCloud',
	'dropbox',
	'onedrive',
	'nextcloud',
	'webdav',
	'amazon_s3',
	'joplinServer',
	'joplinServerSaml',
];


const logosImageNames: Record<string, string> = {
	'dropbox': 'SyncTarget_Dropbox.svg',
	'joplinCloud': 'SyncTarget_JoplinCloud.svg',
	'onedrive': 'SyncTarget_OneDrive.svg',
};

type SyncTargetInfoName = 'dropbox' | 'onedrive' | 'joplinCloud';

export default function(props: Props) {
	const joplinCloudDescriptionRef = useRef(null);

	const closeDialog = useCallback(() => {
		props.dispatch({
			type: 'DIALOG_CLOSE',
			name: 'syncWizard',
		});
	}, [props.dispatch]);

	const onButtonRowClick = useCallback(() => {
		closeDialog();
	}, [closeDialog]);

	const { height: descriptionHeight } = useElementSize(joplinCloudDescriptionRef);

	function renderFeature(enabled: boolean, label: string) {
		const className = enabled ? 'fas fa-check' : 'fas fa-times';
		return (
			<li className={`feature-line${enabled ? '' : ' -disabled'}`} key={label}>
				<i className={`icon ${className}`} role='img' aria-label={enabled ? _('Check') : _('Not checked')}/>
				<div className='label'>{label}</div>
			</li>
		);
	}

	function renderFeatures(name: string) {
		return (
			<ul className='feature-list'>
				{[
					renderFeature(true, _('Sync your notes')),
					renderFeature(name === 'joplinCloud', _('Publish notes to the internet')),
					renderFeature(name === 'joplinCloud', _('Collaborate on notebooks with others')),
				]}
			</ul>
		);
	}

	const onSelectButtonClick = useCallback(async (name: SyncTargetInfoName) => {
		const routes = {
			'dropbox': { name: 'DropboxLogin', target: 7 },
			'onedrive': { name: 'OneDriveLogin', target: 3 },
			'joplinCloud': { name: 'JoplinCloudLogin', target: 10 },
		};
		const route = routes[name];
		if (!route) return; // throw error??

		Setting.setValue('sync.target', route.target);
		await Setting.saveAll();
		closeDialog();
		props.dispatch({
			type: 'NAV_GO',
			routeName: route.name,
		});
	}, [props.dispatch, closeDialog]);

	const baseId = useId();

	function renderSelectArea(info: SyncTargetInfo, describedById: string) {
		return (
			<Button
				className='select-button'
				level={ButtonLevel.Primary}
				title={_('Select')}
				onClick={() => onSelectButtonClick(info.name as SyncTargetInfoName)}
				disabled={false}
				aria-describedby={describedById}
			/>
		);
	}

	function renderSignUpArea(info: SyncTargetInfo) {
		if (info.name !== 'joplinCloud') return null;
		return <JoplinCloudSignUpCallToAction/>;
	}

	function renderSyncTarget(info: SyncTargetInfo) {
		const key = `syncTarget_${info.name}`;
		const height = info.name !== 'joplinCloud' ? descriptionHeight : null;

		const logoImageName = logosImageNames[info.name];
		const logoImageSrc = logoImageName ? `${bridge().buildDir()}/images/${logoImageName}` : '';
		const logo = logoImageSrc ? <img className='sync-target-logo' src={logoImageSrc} aria-hidden={true}/> : null;

		const descriptionComp = (
			<div
				className='description'
				style={height ? { height } : undefined}
				ref={info.name === 'joplinCloud' ? joplinCloudDescriptionRef : null}
			>{info.description}</div>
		);
		const featuresComp = renderFeatures(info.name);

		const renderSlowSyncWarning = () => {
			if (info.name === 'joplinCloud') return null;
			return <div className='slow-sync-warning'>{`⚠️ ${_('%s is not optimised for synchronising many small files so your initial synchronisation will be slow.', info.label)}`}</div>;
		};

		const headerId = `${baseId}-${info.id}`;
		return (
			<div className='sync-target-box' id={key} key={key}>
				<h2 className='title' id={headerId}>{logo}{info.label}</h2>
				{descriptionComp}
				{featuresComp}
				{renderSelectArea(info, headerId)}
				{renderSignUpArea(info)}
				{renderSlowSyncWarning()}
			</div>
		);
	}

	const onSelfHostingClick = useCallback(() => {
		closeDialog();

		props.dispatch({
			type: 'NAV_GO',
			routeName: 'Config',
			props: {
				defaultSection: 'sync',
			},
		});
	}, [props.dispatch, closeDialog]);

	function renderContent() {
		const boxes: React.ReactNode[] = [];

		for (const name of syncTargetNames) {
			const info = SyncTargetRegistry.infoByName(name);
			if (info.supportsSelfHosted) continue;
			boxes.push(renderSyncTarget(info));
		}

		const selfHostingLabelId = `${baseId}-selfHosting`;
		const selfHostingLinkId = `${baseId}-selfHostingLink`;
		const selfHostingMessage = <div className='self-hosting-message'>
			<span id={selfHostingLabelId}>
				Self-hosting? Joplin also supports various self-hosting options such as Nextcloud, WebDAV, AWS S3 and Joplin Server.
			</span>
			{' '}
			<a
				href="#"
				onClick={onSelfHostingClick}

				// Include the link ID in aria-labelledby to include the link text in the
				// description. See
				// https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA7
				id={selfHostingLinkId}
				aria-labelledby={`${selfHostingLabelId} ${selfHostingLinkId}`}
			>
				Click here to select one
			</a>.
		</div>;

		return (
			<div className='content'>
				<div className='sync-target-boxes'>
					{boxes}
				</div>
				{selfHostingMessage}
			</div>
		);
	}

	function renderDialogWrapper() {
		return (
			<div className='sync-wizard-dialog'>
				<DialogTitle title={_('Joplin can synchronise your notes using various providers. Select one from the list below.')}/>
				{renderContent()}
				<DialogButtonRow
					themeId={props.themeId}
					onClick={onButtonRowClick}
					okButtonShow={false}
					cancelButtonLabel={_('Close')}
				/>
			</div>
		);
	}

	return (
		<Dialog onCancel={closeDialog}>{renderDialogWrapper()}</Dialog>
	);
}
