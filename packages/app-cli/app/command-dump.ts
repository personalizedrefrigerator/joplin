import BaseCommand from './base-command';
import Folder from '@joplin/lib/models/Folder';
import Note from '@joplin/lib/models/Note';
import Tag from '@joplin/lib/models/Tag';
import { FolderEntity, NoteEntity } from '@joplin/lib/services/database/types';
import app from './app';
import { ModelType } from '@joplin/lib/BaseModel';

interface Options {
	item?: string;
}

class Command extends BaseCommand {
	public override usage() {
		return 'dump [item]';
	}

	public override description() {
		return 'Dumps the complete database as JSON, or, if specified, just an item.';
	}

	public override hidden() {
		return true;
	}

	private async dumpDatabase_() {
		let items: (NoteEntity | FolderEntity)[] = [];
		const folders = await Folder.all();
		for (let i = 0; i < folders.length; i++) {
			const folder = folders[i];
			const notes = await Note.previews(folder.id);
			items.push(folder);
			items = items.concat(notes);
		}

		const tags = await Tag.all();
		for (let i = 0; i < tags.length; i++) {
			tags[i].notes_ = await Tag.noteIds(tags[i].id);
		}

		items = items.concat(tags);

		this.stdout(JSON.stringify(items));
	}

	public override async action(options: Options) {
		if (options.item) {
			const displayItemIfType = async (type: ModelType) => {
				const item = await app().loadItem(type, options.item);

				if (item) {
					this.stdout(JSON.stringify(item));
					return true;
				}
				return false;
			};

			const possibleItemTypes = [
				ModelType.Folder,
				ModelType.Note,
				ModelType.Resource,
				ModelType.Tag,
			];

			let displayed = false;
			for (const type of possibleItemTypes) {
				displayed = await displayItemIfType(type);
				if (displayed) {
					break;
				}
			}

			if (!displayed) {
				throw new Error(`No such item found: ${options.item}`);
			}
		} else {
			await this.dumpDatabase_();
		}
	}
}

module.exports = Command;
