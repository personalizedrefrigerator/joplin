
// source-map-support can add some time to application startup.
// For evaluation purposes, make it possible to disable using an environment
// variable.
if (!process.env.JOPLIN_SOURCE_MAP_DISABLED) {
	require('source-map-support').install();
}
