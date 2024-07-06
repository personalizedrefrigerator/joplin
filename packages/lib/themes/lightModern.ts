import { Theme } from './type';
import theme_light from './light';

// Based on the Quiet Light theme from @onecrayon.
// https://onecrayon.com/products/quiet-light/index.html#flavors
// https://github.com/onecrayon/theme-quietlight-vsc/blob/master/themes/QuietLight.json

const theme: Theme = {
	...theme_light,

	backgroundColor: '#f5f5f5',
	backgroundColorTransparent: 'rgba(253, 246, 227, 0.9)',
	oddBackgroundColor: '#ebebeb',
	color: '#333', // For regular text
	colorError: '#600',
	colorWarn: '#cb4b16',
	colorFaded: '#839496', // For less important text;
	dividerColor: '#cdcdcd',
	selectedColor: '#d3dbcd',
	urlColor: '#4b83cd',

	searchMarkerBackgroundColor: '#fef935',

	backgroundColor2: '#D6CFE2',
	color2: '#333333',
	colorBright2: '#333333',
	selectedColor2: '#6c71c4',
	colorError2: '#cb4b16',

	backgroundColor3: '#ededf5',
	backgroundColorHover3: '#dcdcdc',
	color3: '#beb4d1',

	raisedBackgroundColor: '#ede8ef',
	raisedColor: '#616161',

	warningBackgroundColor: '#b5890055',

	tableBackgroundColor: '#f2f8fc',
	codeBackgroundColor: '#e6ebf2',
	codeBorderColor: '#D6CFE2',
	codeColor: '#002b36',

	codeMirrorTheme: 'quiet light',
	codeThemeCss: 'atom-one-light.css',
};

export default theme;
