import { assertHasOwnPropertyOfType } from '@joplin/utils/object';
import { ItemId, ResourceData } from './types';

interface InitializationOptions extends ResourceData {
	referencedBy: ItemId[];
}

export default class ResourceRecord implements ResourceData {
	public readonly parentId: undefined;
	public readonly id: ItemId;
	public readonly title: string;
	public readonly mimeType: string;
	public readonly referencedBy: readonly ItemId[] = [];

	public constructor(options: InitializationOptions) {
		this.id = options.id;
		this.title = options.title;
		this.mimeType = options.mimeType;
		this.referencedBy = [...options.referencedBy];
	}

	public static fromSerialized(data: unknown) {
		assertHasOwnPropertyOfType(data, 'id', 'string');
		assertHasOwnPropertyOfType(data, 'title', 'string');
		assertHasOwnPropertyOfType(data, 'mimeType', 'string');
		assertHasOwnPropertyOfType(data, 'referencedBy', 'string[]');

		return new ResourceRecord(data);
	}

	public serialize() {
		return {
			id: this.id,
			title: this.title,
			referencedBy: this.referencedBy,
			mimeType: this.mimeType,
		};
	}

	public get referenceCount() {
		return this.referencedBy.length;
	}

	public withReference(noteId: ItemId) {
		if (this.referencedBy.includes(noteId)) {
			return this;
		}
		return new ResourceRecord({
			id: this.id,
			title: this.title,
			mimeType: this.mimeType,
			referencedBy: [...this.referencedBy, noteId],
		});
	}

	public withoutReference(noteId: ItemId) {
		if (this.referencedBy.includes(noteId)) {
			return this;
		}

		return new ResourceRecord({
			id: this.id,
			title: this.title,
			mimeType: this.mimeType,
			referencedBy: this.referencedBy.filter(ref => ref !== noteId),
		});
	}
}
