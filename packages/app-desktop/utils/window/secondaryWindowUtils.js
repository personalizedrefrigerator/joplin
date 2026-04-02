
// Closes the window after a delay, from within the window.
// This helps work around a crash. See https://github.com/laurent22/joplin/issues/14968.
window.scheduleClose = () => {
	setTimeout(() => {
		window.close();
	}, 500);
};
