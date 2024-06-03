import { Theme } from './type';
import theme_light from './light';

const theme: Theme = {
	...theme_light,

	backgroundColor2: '#fafafb',
	color2: '#1a191a',
	selectedColor2: '#d9d9d9',
	colorError2: '#770000',
	colorWarn2: '#886611',
	colorWarn3: '#789641',

	backgroundColor3: '#fcfcfd',
	backgroundColorHover3: '#cbdaf0',
	color3: '#738598',

	// Color scheme "4" is used for secondary-style buttons. It makes a white
	// button with blue text.
	backgroundColor4: '#ffffff',
	color4: '#3B3B8F',
};

export default theme;
