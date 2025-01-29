import * as React from 'react';
import { createContext, useCallback, useMemo, useRef, useState } from 'react';
import { NotificationType, PopupHandle, PopupControl as PopupManager } from './types';
import NotificationItem, { NotificationDismissEvent } from './NotificationItem';

export const PopupNotificationContext = createContext<PopupManager|null>(null);

interface Props {
	children: React.ReactNode;
}

interface PopupSpec {
	key: string;
	dismissing: boolean;
	type: NotificationType;
	content: ()=> React.ReactNode;
}

const PopupNotificationProvider: React.FC<Props> = props => {
	const [popupSpecs, setPopupSpecs] = useState<PopupSpec[]>([]);
	const nextPopupKey = useRef(0);

	const onNotificationDismiss = useCallback((event: NotificationDismissEvent) => {
		// Start the dismiss animation
		setPopupSpecs(popups => popups.map(p => {
			if (p.key === event.key) {
				return { ...p, dismissing: true };
			} else {
				return p;
			}
		}));

		// Remove the popup
		const dismissAnimationDelay = 500;
		setTimeout(() => {
			setPopupSpecs(popups => popups.filter(p => p.key !== event.key));
		}, dismissAnimationDelay);
	}, []);

	const popupManager = useMemo((): PopupManager => {
		return {
			createPopup(content, type: NotificationType): PopupHandle {
				const key = `popup-${nextPopupKey.current++}`;
				const newPopup = {
					key,
					content,
					type,
					dismissing: false,
				};

				setPopupSpecs(popups => {
					const newPopups = [...popups];

					// Replace the existing popup, if it exists
					const insertIndex = newPopups.findIndex(p => p.key === key);
					if (insertIndex === -1) {
						newPopups.push(newPopup);
					} else {
						newPopups.splice(insertIndex, 1, newPopup);
					}

					return newPopups;
				});

				return {
					remove() {
						onNotificationDismiss({ key });
					},
					// Default to removing after 5.5s + 0.5s
					// See https://www.sheribyrnehaber.com/designing-toast-messages-for-accessibility/
					scheduleRemove(delay = 5_500) {
						setTimeout(() => {
							this.remove();
						}, delay);
					},
				};
			},
		};
	}, [onNotificationDismiss]);

	const popups = [];
	for (const spec of popupSpecs) {
		popups.push(
			<NotificationItem
				key={spec.key}
				type={spec.type}
				onDismiss={onNotificationDismiss}
				dismissing={spec.dismissing}
			>{spec.content()}</NotificationItem>,
		);
	}
	popups.reverse();

	return <PopupNotificationContext.Provider value={popupManager}>
		{props.children}
		<div className='popup-notification-list'>
			{popups}
		</div>
	</PopupNotificationContext.Provider>;
};

export default PopupNotificationProvider;
