import * as React from 'react';

interface Props {
	title: string;
	justifyContent?: 'center'|'start';
}

export default function DialogTitle(props: Props) {
	return (
		<h1 className={`dialog-title ${props.justifyContent === 'center' ? '-center' : ''}`}>
			<span className='content'>
				{props.title}
			</span>
		</h1>
	);
}
