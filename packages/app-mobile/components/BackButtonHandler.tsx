import * as React from 'react';
import { useEffect, useId, useRef } from 'react';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';
import { BackHandlerState, BackHandlerOnBack } from '../utils/types';

interface Props {
	dispatch: Dispatch;
	enabled: boolean;
	description: string|null;
	runsParentAction?: boolean;
	onBack: BackHandlerOnBack;
}

const BackButtonHandler: React.FC<Props> = ({
	dispatch, enabled, runsParentAction, description, onBack,
}) => {
	const onBackRef = useRef(onBack);
	onBackRef.current = onBack;
	const id = useId();

	useEffect(() => {
		const handler: BackHandlerState = {
			id,
			enabled,
			description,
			onBack: () => onBackRef.current?.(),
			runsParent: runsParentAction ?? false,
		};
		dispatch({
			type: 'BACK_HANDLER_ADD_OR_UPDATE',
			handler,
		});
	}, [enabled, description, id, runsParentAction, dispatch]);

	useEffect(() => () => {
		dispatch({
			type: 'BACK_HANDLER_REMOVE',
			id,
		});
	}, [id, dispatch]);

	return null;
};

export default connect(() => ({}))(BackButtonHandler);
