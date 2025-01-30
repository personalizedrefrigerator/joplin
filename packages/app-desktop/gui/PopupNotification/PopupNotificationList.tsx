import * as React from 'react';
import { PopupNotificationContext, VisibleNotificationsContext } from './PopupNotificationProvider';
import NotificationItem from './NotificationItem';
import { useContext } from 'react';

interface Props {}

const PopupNotificationList: React.FC<Props> = () => {
	const popupManager = useContext(PopupNotificationContext);
	const popupSpecs = useContext(VisibleNotificationsContext);
	const popups = [];
	for (const spec of popupSpecs) {
		popups.push(
			<NotificationItem
				key={spec.key}
				type={spec.type}
				onDismiss={popupManager.onPopupDismissed}
				dismissing={spec.dismissing}
			>{spec.content()}</NotificationItem>,
		);
	}
	popups.reverse();
	return <div className='popup-notification-list'>
		{popups}
	</div>;
};

export default PopupNotificationList;
