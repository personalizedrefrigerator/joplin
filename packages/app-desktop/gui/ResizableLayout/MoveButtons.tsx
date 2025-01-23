import * as React from 'react';
import { useCallback } from 'react';
import Button, { ButtonLevel } from '../Button/Button';
import { MoveDirection } from './utils/movements';
import styled from 'styled-components';
import { _ } from '@joplin/lib/locale';

const StyledRoot = styled.div`
	display: flex;
	flex-direction: column;
	padding: 5px;
	background-color: ${props => props.theme.backgroundColor};
	border-radius: 5px;
`;

const ButtonRow = styled.div`
	display: flex;
	flex-direction: row;
	justify-content: center;
`;

const EmptyButton = styled(Button)`
	visibility: hidden;
`;

const ArrowButton = styled(Button)`
	opacity: ${props => props.disabled ? 0.2 : 1};
`;

export interface MoveButtonClickEvent {
	direction: MoveDirection;
	itemKey: string;
}

interface Props {
	onClick(event: MoveButtonClickEvent): void;
	itemKey: string;
	canMoveLeft: boolean;
	canMoveRight: boolean;
	canMoveUp: boolean;
	canMoveDown: boolean;
}

export default function MoveButtons(props: Props) {
	const onButtonClick = useCallback((direction: MoveDirection) => {
		props.onClick({ direction, itemKey: props.itemKey });
	}, [props.onClick, props.itemKey]);

	function canMove(dir: MoveDirection) {
		if (dir === MoveDirection.Up) return props.canMoveUp;
		if (dir === MoveDirection.Down) return props.canMoveDown;
		if (dir === MoveDirection.Left) return props.canMoveLeft;
		if (dir === MoveDirection.Right) return props.canMoveRight;
		throw new Error('Unreachable');
	}

	const iconLabel = (dir: MoveDirection) => {
		if (dir === MoveDirection.Up) return _('Move up');
		if (dir === MoveDirection.Down) return _('Move down');
		if (dir === MoveDirection.Left) return _('Move left');
		if (dir === MoveDirection.Right) return _('Move right');
		const unreachable: never = dir;
		throw new Error(`Invalid direction: ${unreachable}`);
	};

	function renderButton(dir: MoveDirection) {
		return <ArrowButton
			disabled={!canMove(dir)}
			level={ButtonLevel.Primary}
			iconName={`fas fa-arrow-${dir}`}
			iconLabel={iconLabel(dir)}
			onClick={() => onButtonClick(dir)}
		/>;
	}

	return (
		<StyledRoot>
			<ButtonRow>
				{renderButton(MoveDirection.Up)}
			</ButtonRow>
			<ButtonRow>
				{renderButton(MoveDirection.Left)}
				<EmptyButton iconName="fas fa-arrow-down" aria-hidden={true} disabled={true}/>
				{renderButton(MoveDirection.Right)}
			</ButtonRow>
			<ButtonRow>
				{renderButton(MoveDirection.Down)}
			</ButtonRow>
		</StyledRoot>
	);
}
