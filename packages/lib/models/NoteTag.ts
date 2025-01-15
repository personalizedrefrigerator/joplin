import BaseItem from './BaseItem';
import BaseModel from '../BaseModel';

export default class NoteTag extends BaseItem {
	public static tableName() {
		return 'note_tags';
	}

	public static modelType() {
		return BaseModel.TYPE_NOTE_TAG;
	}

	public static async byNoteIds(noteIds: string[]) {
		if (!noteIds.length) return [];
		const idsSql = this.whereIdsInSql({ ids: noteIds, field: 'note_id' });
		return this.modelSelectAll(`SELECT * FROM note_tags WHERE ${idsSql.sql}`, idsSql.params);
	}

	public static async tagIdsByNoteId(noteId: string) {
		const rows = await this.db().selectAll('SELECT tag_id FROM note_tags WHERE note_id = ?', [noteId]);
		const output = [];
		for (let i = 0; i < rows.length; i++) {
			output.push(rows[i].tag_id);
		}
		return output;
	}
}
