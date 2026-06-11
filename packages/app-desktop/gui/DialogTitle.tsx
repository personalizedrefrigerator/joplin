import * as React from 'react';

interface Props {
	title: string;
}

export default function DialogTitle(props: Props) {
	return (
		<h1 className='dialog-title'>{props.title}</h1>
	);
}
