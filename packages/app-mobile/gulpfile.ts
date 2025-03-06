const gulp = require('gulp');
const utils = require('@joplin/tools/gulp/utils');
const compilePackageInfo = require('@joplin/tools/compilePackageInfo');

import buildAllDefaultPlugins from '@joplin/default-plugins/commands/buildAll';
import { AppType } from '@joplin/default-plugins/types';
import injectedJsGulpTasks from './tools/buildInjectedJs/gulpTasks';

const tasks = {
	encodeAssets: {
		fn: require('./tools/encodeAssets'),
	},
	copyWebAssets: {
		fn: require('./tools/copyAssets').default,
	},
	compilePackageInfo: {
		fn: async () => {
			await compilePackageInfo(`${__dirname}/package.json`, `${__dirname}/packageInfo.js`);
		},
	},

	...injectedJsGulpTasks,
	buildDefaultPlugins: {
		fn: async () => {
			const outputDir = `${__dirname}/default-plugins/`;
			await buildAllDefaultPlugins(AppType.Mobile, outputDir);
		},
	},
	podInstall: {
		fn: require('./tools/podInstall'),
	},
};

utils.registerGulpTasks(gulp, tasks);

gulp.task('buildInjectedJs', gulp.series(
	'beforeBundle',
	'buildCodeMirrorEditor',
	'buildJsDrawEditor',
	'buildPluginBackgroundScript',
	'buildNoteViewerBundle',
	'copyWebviewLib',
));

gulp.task('watchInjectedJs', gulp.series(
	'beforeBundle',
	'copyWebviewLib',
	gulp.parallel(
		'watchCodeMirrorEditor',
		'watchJsDrawEditor',
		'watchPluginBackgroundScript',
		'watchNoteViewerBundle',
	),
));

gulp.task('build', gulp.series(
	'compilePackageInfo',
	'buildInjectedJs',
	'buildDefaultPlugins',
	'copyWebAssets',
	'encodeAssets',
	'podInstall',
));
