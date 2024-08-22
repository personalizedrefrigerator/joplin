import MirrorJournalEntry, { MirrorJournalData } from "../../models/MirrorJournalEntry";
import { TreeLike as ItemTreeLike } from "./types";

export default class JournalTree implements ItemTreeLike {
	private items_: Map<string, MirrorJournalData>;

	public constructor() { }

	public static async fromDatabase(mirrorId: string) {
		const items = await MirrorJournalEntry.allForMirror(mirrorId);

		const tree = new JournalTree();
		tree.items_ = new Map();
		for (const item of items) {
			tree.items_.set(item.path, item);
		}
		return tree;
	}

	public hashAtPath(path: string) {
		return this.items_.get(path).hash_md5;
	}

	public hasPath(path: string) {
		return this.items_.has(path);
	}

	public items() {
		return this.items_.entries();
	}
}
