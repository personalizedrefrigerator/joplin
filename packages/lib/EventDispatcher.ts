type Listener<Value> = (data: Value)=> void;
type CallbackHandler<EventType> = (data: EventType)=> void;

// EventKeyType is used to distinguish events (e.g. a 'ClickEvent' vs a 'TouchEvent')
// while EventMessageType is the type of the data sent with an event (can be `void`)
export default class EventDispatcher<EventKeyType extends string|symbol|number, EventMessageType> {
	private listeners: Map<EventKeyType, Listener<EventMessageType>[]>;
	public constructor() {
		this.listeners = new Map();
	}

	public dispatch(eventName: EventKeyType, event: EventMessageType = null) {
		if (!this.listeners.has(eventName)) return;

		const ls = this.listeners.get(eventName) ?? [];
		for (let i = 0; i < ls.length; i++) {
			ls[i](event);
		}
	}

	public on(eventName: EventKeyType, callback: CallbackHandler<EventMessageType>) {
		if (!this.listeners.has(eventName)) {
			this.listeners.set(eventName, []);
		}
		this.listeners.get(eventName).push(callback);

		return {
			// Returns false if the listener has already been removed, true otherwise.
			remove: (): boolean => {
				const originalListeners = this.listeners.get(eventName);
				this.off(eventName, callback);

				return originalListeners?.length !== this.listeners.get(eventName)?.length;
			},
		};
	}

	// Equivalent to calling .remove() on the object returned by .on
	public off(eventName: EventKeyType, callback: CallbackHandler<EventMessageType>) {
		const eventListeners = this.listeners.get(eventName);
		if (!eventListeners) return;

		// Replace the current list of listeners with a new, shortened list.
		// This allows any iterators over this.listeners to continue iterating
		// without skipping elements.
		this.listeners.set(eventName, eventListeners.filter(
			otherCallback => otherCallback !== callback,
		));
	}

	public removeAllListeners() {
		this.listeners.clear();
	}
}
