import * as React from 'react';

import { connect } from 'react-redux';
import Tag from '@joplin/lib/models/Tag';
import ModalDialog from '../ModalDialog';
import { AppState } from '../../utils/types';
import { TagEntity } from '@joplin/lib/services/database/types';
import TagEditor from '../TagEditor';
import { _ } from '@joplin/lib/locale';

interface Props {
	themeId: number;
	noteId: string|null;
	onCloseRequested?: ()=> void;
	tags: TagEntity[];
}

interface State {
	noteId: string|null;
	savingTags: boolean;
	noteTags: string[];
}

class NoteTagsDialogComponent extends React.Component<Props, State> {
	public constructor(props: Props) {
		super(props);
		this.state = {
			noteId: null,
			savingTags: false,
			noteTags: [],
		};
	}

	private okButton_press = async () => {
		this.setState({ savingTags: true });

		try {
			await Tag.setNoteTagsByTitles(this.state.noteId, this.state.noteTags);
		} finally {
			this.setState({ savingTags: false });
		}

		if (this.props.onCloseRequested) this.props.onCloseRequested();
	};

	private cancelButton_press = () => {
		if (this.props.onCloseRequested) this.props.onCloseRequested();
	};

	public override UNSAFE_componentWillMount() {
		const noteId = this.props.noteId;
		this.setState({ noteId: noteId });
		void this.loadNoteTags(noteId);
	}

	private async loadNoteTags(noteId: string) {
		const tags = await Tag.tagsByNoteId(noteId);
		const noteTags = tags.map(t => t.title);

		this.setState({ noteTags: noteTags });
	}

	private onAddTag_ = (tag: string) => {
		this.setState(state => ({
			noteTags: !state.noteTags.includes(tag) ? [...state.noteTags, tag] : state.noteTags,
		}));
	};

	private onRemoveTag_ = (tag: string) => {
		this.setState(state => ({
			noteTags: state.noteTags.filter(other => other !== tag),
		}));
	};


	public override render() {
		const allTags = this.state.noteTags;
		return <ModalDialog
			themeId={this.props.themeId}
			onOkPress={this.okButton_press}
			onCancelPress={this.cancelButton_press}
			buttonBarEnabled={!this.state.savingTags}
			okTitle={_('Apply')}
			cancelTitle={_('Cancel')}
		>
			<TagEditor
				themeId={this.props.themeId}
				tags={allTags}
				onRemoveTag={this.onRemoveTag_}
				style={{ flex: 1 }}
				onAddTag={this.onAddTag_}
			/>
		</ModalDialog>;
	}
}

const NoteTagsDialog = connect((state: AppState) => {
	return {
		themeId: state.settings.theme,
		tags: state.tags,
		noteId: state.selectedNoteIds.length ? state.selectedNoteIds[0] : null,
	};
})(NoteTagsDialogComponent);

export default NoteTagsDialog;
