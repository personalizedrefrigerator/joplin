import * as React from 'react';
import { NotificationType } from './types';

export interface NotificationDismissEvent {
	key: string;
}

interface Props {
	children: React.ReactNode;
	key: string;
	type: NotificationType;
	onDismiss: (event: NotificationDismissEvent)=> void;
	dismissing: boolean;
}

const NotificationItem: React.FC<Props> = props => {
	const iconClassName = (() => {
		if (props.type === NotificationType.Success) return 'fas fa-check';
		if (props.type === NotificationType.Error) return 'fas fa-times';
		if (props.type === NotificationType.Info) return 'fas fa-info';
		return '';
	})();

	const containerModifier = (() => {
		if (props.type === NotificationType.Success) return '-success';
		if (props.type === NotificationType.Error) return '-error';
		return '';
	})();

	return <div
		role='alert'
		className={`popup-notification-item ${containerModifier} ${props.dismissing ? '-dismissing' : ''}`}
	>
		<i role='img' aria-hidden='true' className={`icon ${iconClassName}`}></i>
		<div className='ripple'/>
		<div className='content'>
			{props.children}
		</div>
	</div>;
};

export default NotificationItem;
