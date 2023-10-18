import RemoteMessenger from './RemoteMessenger';
import { ReturnsPromises, SerializableData } from './types';

// LocalInterface and RemoteInterface methods must also all accept and return
// serializable data.
export default class WindowMessenger<
	LocalInterface extends ReturnsPromises<LocalInterface>,
	RemoteInterface extends ReturnsPromises<RemoteInterface>,
> extends RemoteMessenger<
	LocalInterface, RemoteInterface
	> {
	public constructor(private remoteWindow: Window, localApi: LocalInterface) {
		super(localApi);

		window.addEventListener('message', this.handleMessageEvent);

		this.onReadyToReceive();
	}

	private handleMessageEvent = (event: MessageEvent) => {
		if (event.source !== this.remoteWindow) {
			return;
		}

		void this.onMessage(event.data);
	};

	protected override postMessage(message: SerializableData): void {
		this.remoteWindow.postMessage(message, '*');
	}
}
