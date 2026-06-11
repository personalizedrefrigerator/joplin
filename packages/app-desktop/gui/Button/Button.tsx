import * as React from 'react';

export enum ButtonLevel {
	Primary = 'primary',
	Secondary = 'secondary',
	Tertiary = 'tertiary',
	SidebarSecondary = 'sidebarSecondary',
	Recommended = 'recommended',
}

export enum ButtonSize {
	Small = 1,
	Normal = 2,
}

type ReactButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;
interface Props extends Omit<ReactButtonProps, 'onClick'> {
	title?: string;
	iconName?: string;
	level?: ButtonLevel;
	iconLabel?: string;
	onClick?: ()=> void;
	iconAnimation?: string;
	tooltip?: string;
	disabled?: boolean;
	size?: ButtonSize;
	isSquare?: boolean;
	iconOnly?: boolean;
	fontSize?: number;
}

export const buttonSizePx = (props: Props | ButtonSize) => {
	const buttonSize = typeof props === 'number' ? props : props.size;
	if (!buttonSize || buttonSize === ButtonSize.Normal) return 32;
	if (buttonSize === ButtonSize.Small) return 26;
	throw new Error(`Unknown size: ${buttonSize}`);
};

const levelClassName = (level: ButtonLevel) => {
	if (level === ButtonLevel.Primary) return '-primary';
	if (level === ButtonLevel.Tertiary) return '-tertiary';
	if (level === ButtonLevel.SidebarSecondary) return '-sidebar-secondary';
	if (level === ButtonLevel.Recommended) return '-recommended';
	return '-secondary';
};

const Button = React.forwardRef(({
	iconName, iconLabel, iconAnimation, title, level, fontSize, isSquare, tooltip, disabled, size, className, style, onClick: propsOnClick, ...unusedProps
}: Props, ref: React.Ref<HTMLButtonElement>) => {
	const iconOnly = iconName && !title;
	const square = iconOnly || isSquare;

	function renderIcon() {
		if (!iconName) return null;
		return <span
			aria-label={iconLabel ?? undefined}
			aria-hidden={!iconLabel}
			style={iconAnimation ? { animation: iconAnimation } : undefined}
			className={`${iconName} icon`}
			role='img'
		/>;
	}

	function renderTitle() {
		if (!title) return null;
		return <span className='title'>{title}</span>;
	}

	function onClick() {
		if (disabled) return;
		propsOnClick();
	}

	const classNames = ['app-button', levelClassName(level)];
	if (size === ButtonSize.Small) classNames.push('-small');
	if (square) classNames.push('-square');
	if (className) classNames.push(className);

	return (
		<button
			ref={ref}
			className={classNames.join(' ')}
			style={{ ...style, ...(fontSize ? { fontSize } : {}) }}
			disabled={disabled}
			title={tooltip}
			onClick={onClick}

			// When there's no title, the button needs a label. In this case, fall back
			// to the tooltip.
			aria-label={title ? undefined : tooltip}
			aria-disabled={disabled}
			{...unusedProps}
		>
			{renderIcon()}
			{renderTitle()}
		</button>
	);
});

export default Button;
