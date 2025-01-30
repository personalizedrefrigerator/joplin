import * as React from 'react';
import { createContext, useMemo, useRef, useState } from 'react';
import { NotificationType, PopupHandle, PopupControl as PopupManager } from './types';
import { Hour } from '@joplin/utils/time';

export const PopupNotificationContext = createContext<PopupManager|null>(null);
export const VisibleNotificationsContext = createContext<PopupSpec[]>([]);

interface Props {
	children: React.ReactNode;
}

interface PopupSpec {
	key: string;
	dismissedAt: number|undefined;
	type: NotificationType;
	content: ()=> React.ReactNode;
}

const PopupNotificationProvider: React.FC<Props> = props => {
	const [popupSpecs, setPopupSpecs] = useState<PopupSpec[]>([]);
	const nextPopupKey = useRef(0);

	const popupManager = useMemo((): PopupManager => {
		const removeOldPopups = () => {
			// The WCAG allows dismissing notifications older than 20 hours.
			setPopupSpecs(popups => popups.filter(popup => {
				if (!popup.dismissedAt) {
					return true; // Not dismissed
				}

				const dismissedRecently = popup.dismissedAt > performance.now() - Hour * 20;
				return dismissedRecently;
			}));
		};

		const manager: PopupManager = {
			createPopup: (content, { type } = {}): PopupHandle => {
				const key = `popup-${nextPopupKey.current++}`;
				const newPopup: PopupSpec = {
					key,
					content,
					type,
					dismissedAt: undefined,
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

				const handle: PopupHandle = {
					remove() {
						manager.onPopupDismissed({ key });
					},
					// Default to removing after 5.5s + 0.5s
					// See https://www.sheribyrnehaber.com/designing-toast-messages-for-accessibility/
					scheduleRemove(delay = 5_500) {
						setTimeout(() => {
							handle.remove();
						}, delay);
					},
				};
				return handle;
			},
			onPopupDismissed: (event) => {
				// Start the dismiss animation
				const dismissAnimationDelay = 600;
				setPopupSpecs(popups => popups.map(p => {
					if (p.key === event.key) {
						return { ...p, dismissedAt: performance.now() + dismissAnimationDelay };
					} else {
						return p;
					}
				}));

				removeOldPopups();
			},
		};
		return manager;
	}, []);

	return <PopupNotificationContext.Provider value={popupManager}>
		<VisibleNotificationsContext.Provider value={popupSpecs}>
			{props.children}
		</VisibleNotificationsContext.Provider>
	</PopupNotificationContext.Provider>;
};

export default PopupNotificationProvider;
