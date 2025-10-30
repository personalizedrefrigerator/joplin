
export interface EditorCursorLocations {
	readonly richText?: unknown; // Depends on the editor implementation
	readonly markdown?: number;
}

export default class NotePositionService {
	private constructor() {}

	private static instance_: NotePositionService;
	public static instance() {
		this.instance_ ??= new NotePositionService();
		return this.instance_;
	}

	private getMappingKey_(noteId: string, windowId: string) {
		return `${windowId}--${noteId}`;
	}

	private positionMapping_: Map<string, EditorCursorLocations> = new Map();
	public getCursorPosition(noteId: string, windowId: string) {
		return this.positionMapping_.get(this.getMappingKey_(noteId, windowId)) ?? { };
	}
	public updateCursorPosition(noteId: string, windowId: string, position: EditorCursorLocations) {
		const key = this.getMappingKey_(noteId, windowId);
		this.positionMapping_.set(key, {
			...this.positionMapping_.get(key),
			...position,
		});
	}

	private scrollMapping_: Map<string, number> = new Map();
	public getScrollPercent(noteId: string, windowId: string) {
		return this.scrollMapping_.get(this.getMappingKey_(noteId, windowId)) ?? 0;
	}
	public updateScrollPosition(noteId: string, windowId: string, percent: number) {
		const key = this.getMappingKey_(noteId, windowId);
		this.scrollMapping_.set(key, percent);
	}
}
