import * as React from 'react';
import { VisibleNotificationsContext } from './PopupNotificationProvider';
import NotificationItem from './NotificationItem';
import { useContext } from 'react';
import Dialog from '../Dialog';
import Button from '../Button/Button';
import { _ } from '@joplin/lib/locale';

interface Props {
	visible: boolean;
	onClose: ()=> void;
}

const NotificationHistoryDialog: React.FC<Props> = props => {
	const popupSpecs = useContext(VisibleNotificationsContext);
	const popups = [];
	for (const spec of popupSpecs) {
		popups.push(
			<NotificationItem
				key={spec.key}
				type={spec.type}
				dismissing={false}
				popup={false}
			>{spec.content()}</NotificationItem>,
		);
	}

	if (!props.visible) return null;
	return <Dialog onCancel={props.onClose}>
		<h1>{_('Recent notifications')}</h1>
		<ul className='popup-notification-list'>
			{popups.length ? popups : <div>{_('No recent notifications')}</div>}
		</ul>
		<Button onClick={props.onClose} title={_('Done')}/>
	</Dialog>;
};

export default NotificationHistoryDialog;
