import * as React from 'react';
import { VisibleNotificationsContext } from './PopupNotificationProvider';
import NotificationItem from './NotificationItem';
import { useContext } from 'react';

interface Props {}

// This component displays the popups managed by PopupNotificationContext.
// This allows popups to be shown in multiple windows at the same time.
const PopupNotificationList: React.FC<Props> = () => {
	const popupSpecs = useContext(VisibleNotificationsContext);
	const popups = [];
	for (const spec of popupSpecs) {
		const dismissed = spec.dismissAt <= performance.now();
		if (dismissed) continue;

		popups.push(
			<NotificationItem
				key={spec.key}
				type={spec.type}
				dismissing={!!spec.dismissAt}
				popup={true}
			>{spec.content()}</NotificationItem>,
		);
	}
	popups.reverse();

	return <ul className='popup-notification-list -overlay'>
		{popups}
	</ul>;
};

export default PopupNotificationList;
