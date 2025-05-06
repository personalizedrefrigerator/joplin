import * as React from 'react';
import { ViewStyle, TextStyle } from 'react-native';
import IconButton from '../IconButton';
import { _ } from '@joplin/lib/locale';
import { AppState, BackHandlerState } from '../../utils/types';
import { connect } from 'react-redux';
import BackButtonService from '../../services/BackButtonService';
import { useCallback } from 'react';

interface Props {
	containerStyleEnabled: ViewStyle;
	containerStyleDisabled: ViewStyle;
	iconStyle: TextStyle;

	themeId: number;
	backHandler: BackHandlerState|null;
}

const BackButton: React.FC<Props> = ({
	themeId, containerStyleEnabled, containerStyleDisabled, iconStyle, backHandler,
}) => {
	const onPress = useCallback(() => {
		void BackButtonService.back();
	}, []);
	const disabled = !backHandler?.enabled;
	const description = backHandler?.description ? _('Back: %s', backHandler.description) : _('Back');

	return <IconButton
		onPress={onPress}
		contentWrapperStyle={disabled ? containerStyleDisabled : containerStyleEnabled}
		themeId={themeId}
		disabled={!!disabled}
		description={description}
		iconName={'ionicon arrow-back'}
		iconStyle={iconStyle}
	/>;
};

export default connect((state: AppState) => {
	return {
		themeId: state.settings.theme,
		backHandler: state.activeBackHandler,
	};
})(BackButton);
