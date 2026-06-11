import * as React from 'react';
import Button from '../../gui/Button/Button';
import { _ } from '@joplin/lib/locale';
import { ButtonSpec } from '@joplin/lib/services/plugins/api/types';

interface Props {
	buttons: ButtonSpec[];
}

function buttonTitle(b: ButtonSpec) {
	if (b.title) return b.title;

	const defaultTitles: Record<string, string> = {
		'ok': _('OK'),
		'cancel': _('Cancel'),
		'yes': _('Yes'),
		'no': _('No'),
		'close': _('Close'),
	};

	return defaultTitles[b.id] ? defaultTitles[b.id] : b.id;
}

export default function UserWebviewDialogButtonBar(props: Props) {
	function renderButtons() {
		const output = [];
		for (let i = 0; i < props.buttons.length; i++) {
			const b = props.buttons[i];
			output.push(<Button key={b.id} onClick={b.onClick} title={buttonTitle(b)}/>);
		}
		return output;
	}

	return (
		<div className='user-dialog-button-bar'>
			{renderButtons()}
		</div>
	);
}
