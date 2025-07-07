
// source-map-support can add some time to application startup.
// Disable it unless explicitly requested:
if (process.env.JOPLIN_SOURCE_MAP_ENABLED) {
	require('source-map-support').install();
}
