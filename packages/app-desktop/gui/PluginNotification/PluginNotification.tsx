import * as React from 'react';
import { useContext, useEffect, useMemo } from 'react';
import { Toast, ToastType } from '@joplin/lib/services/plugins/api/types';
import { PopupNotificationContext } from '../PopupNotification/PopupNotificationProvider';
import { NotificationType } from '../PopupNotification/types';

const emptyToast = (): Toast => {
	return {
		duration: 0,
		message: '',
		type: ToastType.Info,
		timestamp: 0,
	};
};

interface Props {
	themeId: number;
	toast: Toast;
}

export default (props: Props) => {
	const popupManager = useContext(PopupNotificationContext);

	const toast = useMemo(() => {
		const toast: Toast = props.toast ? props.toast : emptyToast();
		return toast;
	}, [props.toast]);

	useEffect(() => {
		if (!toast.message) return;

		popupManager.createPopup(() => toast.message, {
			type: toast.type as string as NotificationType,
		}).scheduleDismiss(toast.duration);
	}, [toast.message, toast.duration, toast.type, popupManager]);

	return <div style={{ display: 'none' }}/>;
};
