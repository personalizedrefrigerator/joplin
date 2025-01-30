import * as React from 'react';
import { PopupNotificationContext, VisibleNotificationsContext } from './PopupNotificationProvider';
import NotificationItem from './NotificationItem';
import { useContext } from 'react';

interface Props {}

// This component displays the popups managed by PopupNotificationContext.
// This allows popups to be shown in multiple windows at the same time.
const PopupNotificationList: React.FC<Props> = () => {
	const popupManager = useContext(PopupNotificationContext);
	const popupSpecs = useContext(VisibleNotificationsContext);
	const popups = [];
	for (const spec of popupSpecs) {
		const dismissed = spec.dismissedAt <= performance.now();
		if (dismissed) continue;

		popups.push(
			<NotificationItem
				key={spec.key}
				type={spec.type}
				onDismiss={popupManager.onPopupDismissed}
				dismissing={!!spec.dismissedAt}
				popup={true}
			>{spec.content()}</NotificationItem>,
		);
	}
	popups.reverse();

	return <div className='popup-notification-list -overlay'>
		{popups}
	</div>;
};

export default PopupNotificationList;
