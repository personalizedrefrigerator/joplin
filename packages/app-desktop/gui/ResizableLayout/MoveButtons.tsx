import * as React from 'react';
import { useCallback, useId } from 'react';
import Button, { ButtonLevel } from '../Button/Button';
import { MoveDirection } from './utils/movements';
import { _ } from '@joplin/lib/locale';

type ButtonKey = string;

export interface MoveButtonClickEvent {
	direction: MoveDirection;
	itemKey: string;
	buttonKey: ButtonKey;
}

interface Props {
	onClick(event: MoveButtonClickEvent): void;
	itemKey: string;
	itemLabel: string;
	canMoveLeft: boolean;
	canMoveRight: boolean;
	canMoveUp: boolean;
	canMoveDown: boolean;

	// Specifies which button to auto-focus (if any). Clicking a "Move ..." button changes the app's layout. By default, this
	// causes focus to jump to the start of the move dialog. Providing the key of the last-clicked button allows focus
	// to be restored after changing the app layout:
	autoFocusKey: ButtonKey|null;
}

export default function MoveButtons(props: Props) {
	const onButtonClick = useCallback((direction: MoveDirection) => {
		props.onClick({ direction, itemKey: props.itemKey, buttonKey: `${props.itemKey}-${direction}` });
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

	const descriptionId = useId();

	const buttonKey = (dir: MoveDirection) => `${props.itemKey}-${dir}`;
	const autoFocusDirection = (() => {
		if (!props.autoFocusKey) return undefined;

		const buttonDirections = [MoveDirection.Up, MoveDirection.Down, MoveDirection.Left, MoveDirection.Right];
		const autoFocusDirection = buttonDirections.find(
			direction => buttonKey(direction) === props.autoFocusKey,
		);

		if (!autoFocusDirection) {
			return null;
		}

		const autoFocusDirectionEnabled = autoFocusDirection && canMove(autoFocusDirection);
		if (autoFocusDirectionEnabled) {
			return autoFocusDirection;
		} else {
			// Select an enabled direction instead
			return buttonDirections.find(dir => canMove(dir));
		}
	})();

	function renderButton(dir: MoveDirection) {
		return <Button
			className='arrow'
			disabled={!canMove(dir)}
			level={ButtonLevel.Primary}
			iconName={`fas fa-arrow-${dir}`}
			iconLabel={iconLabel(dir)}
			autoFocus={autoFocusDirection === dir}
			onClick={() => onButtonClick(dir)}
		/>;
	}

	return (
		<div className='move-buttons' role='group' aria-labelledby={descriptionId}>
			<div className='move-button-row'>
				{renderButton(MoveDirection.Up)}
			</div>
			<div className='move-button-row'>
				{renderButton(MoveDirection.Left)}
				<Button className='empty' iconName="fas fa-arrow-down" aria-hidden={true} disabled={true}/>
				{renderButton(MoveDirection.Right)}
			</div>
			<div className='move-button-row'>
				{renderButton(MoveDirection.Down)}
			</div>
			<div className='label' id={descriptionId}>{props.itemLabel}</div>
		</div>
	);
}
