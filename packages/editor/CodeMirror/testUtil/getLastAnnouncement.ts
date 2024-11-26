import { EditorView } from '@codemirror/view';

// Returns the most recent accessibility announcement made by
// EditorView.announce.of.
const getLastAnnouncement = (view: EditorView) => {
	const announcementContainer = view.dom.querySelector('.cm-announced');
	return announcementContainer.textContent;
};

export default getLastAnnouncement;
