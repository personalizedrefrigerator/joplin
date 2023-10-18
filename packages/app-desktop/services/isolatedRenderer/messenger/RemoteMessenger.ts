import uuid from '@joplin/lib/uuid';
import { ReturnsPromises, SerializableData } from './types';

enum MessageType {
	RemoteReady = 'RemoteReady',
	InvokeMethod = 'InvokeMethod',
	ErrorResponse = 'ErrorResponse',
	ReturnValueResponse = 'ReturnValueResponse',
}

type RemoteReadyMessage = Readonly<{
	kind: MessageType.RemoteReady;
}>;

type InvokeMethodMessage = Readonly<{
	kind: MessageType.InvokeMethod;

	respondWithId: string;
	methodName: string;
	arguments: SerializableData[];
}>;

type ErrorResponse = Readonly<{
	kind: MessageType.ErrorResponse;

	responseId: string;
	errorMessage: string;
}>;

type ReturnValueResponse = Readonly<{
	kind: MessageType.ReturnValueResponse;

	responseId: string;
	returnValue: SerializableData;
}>;

type InternalMessage = RemoteReadyMessage|InvokeMethodMessage|ErrorResponse|ReturnValueResponse;

// Listeners for a remote method to resolve or reject.
type OnMethodResolveListener = (returnValue: SerializableData)=> void;
type OnMethodRejectListener = (errorMessage: string)=> void;
type OnRemoteReadyListener = ()=> void;

type OnAllMethodsRespondedToListener = ()=> void;

// A thin wrapper around postMessage. A script within `targetWindow` should
// also construct a RemoteMessenger (with IncomingMessageType and
// OutgoingMessageType reversed).
export default abstract class RemoteMessenger<
	LocalInterface extends ReturnsPromises<LocalInterface>,
	RemoteInterface extends ReturnsPromises<RemoteInterface>,
> {
	private resolveMethodCallbacks: Record<string, OnMethodResolveListener> = Object.create(null);
	private rejectMethodCallbacks: Record<string, OnMethodRejectListener> = Object.create(null);

	private numberUnrespondedToMethods = 0;
	private noWaitingMethodsListeners: OnAllMethodsRespondedToListener[] = [];

	private remoteReadyListeners: OnRemoteReadyListener[] = [];
	private isRemoteReady = false;
	private isLocalReady = false;

	public readonly remoteApi: RemoteInterface;

	public constructor(private localInterface: LocalInterface) {
		this.remoteApi = new Proxy({}, {
			// Map all properties to functions that invoke remote
			// methods.
			get: (_target, property: string) => (...args: SerializableData[]) => {
				return this.invokeRemoteMethod(property, args);
			},
		}) as RemoteInterface;
	}

	private async invokeRemoteMethod(methodName: string, args: SerializableData[]) {
		this.numberUnrespondedToMethods ++;
		// Wait for the remote to be ready to receive before
		// actually sending a message.
		await this.awaitRemoteReady();

		return new Promise<SerializableData>((resolve, reject) => {
			const responseId = uuid.createNano();

			this.resolveMethodCallbacks[responseId] = returnValue => {
				resolve(returnValue);
			};
			this.rejectMethodCallbacks[responseId] = (errorMessage: string) => {
				reject(errorMessage);
			};

			this.postMessage({
				kind: MessageType.InvokeMethod,
				methodName,
				arguments: args,
				respondWithId: responseId,
			});
		});
	}

	private canRemoteCallMethod(methodName: string) {
		// Here we use `Object.keys` and not `in` because `in` seems to allow
		// methods like `constructor` (and similar) that we don't want to allow.
		// Only allow explicitly defined methods.
		return Object.keys(this.localInterface).includes(methodName);
	}

	// Calls a local method and sends the result to the remote connection.
	private async invokeLocalMethod(message: InvokeMethodMessage) {
		try {
			if (!this.canRemoteCallMethod(message.methodName)) {
				throw new Error(`Method ${message.methodName} is not directly implemented`);
			}

			// A type assertion here is necessary for TypeScript to allow us
			// to index localInterface:
			const methodName = message.methodName as keyof LocalInterface;
			const result = await this.localInterface[methodName](...message.arguments);

			this.postMessage({
				kind: MessageType.ReturnValueResponse,
				responseId: message.respondWithId,
				returnValue: result,
			});
		} catch (error) {
			console.error('Error: ', error);

			this.postMessage({
				kind: MessageType.ErrorResponse,
				responseId: message.respondWithId,
				errorMessage: `${error}`,
			});
		}
	}

	private onMethodRespondedTo(responseId: string) {
		delete this.resolveMethodCallbacks[responseId];
		delete this.rejectMethodCallbacks[responseId];

		this.numberUnrespondedToMethods --;
		if (this.numberUnrespondedToMethods === 0) {
			for (const listener of this.noWaitingMethodsListeners) {
				listener();
			}
			this.noWaitingMethodsListeners = [];
		} else if (this.numberUnrespondedToMethods < 0) {
			this.numberUnrespondedToMethods = 0;
			throw new Error('Some method has been responded to multiple times');
		}
	}

	private async onRemoteResolve(message: ReturnValueResponse) {
		this.resolveMethodCallbacks[message.responseId](message.returnValue);
		this.onMethodRespondedTo(message.responseId);
	}

	private async onRemoteReject(message: ErrorResponse) {
		this.rejectMethodCallbacks[message.responseId](message.errorMessage);
		this.onMethodRespondedTo(message.responseId);
	}

	private async onRemoteReadyToReceive() {
		if (this.isRemoteReady) {
			return;
		}

		this.isRemoteReady = true;
		for (const listener of this.remoteReadyListeners) {
			listener();
		}

		// If ready, re-send the RemoteReady message, it may have been sent before
		// the remote first loaded.
		if (this.isLocalReady) {
			this.postMessage({ kind: MessageType.RemoteReady });
		}
	}

	private awaitRemoteReady() {
		return new Promise<void>(resolve => {
			if (this.isRemoteReady) {
				resolve();
			} else {
				this.remoteReadyListeners.push(() => resolve());
			}
		});
	}

	// Wait for all methods to have received a response.
	// This can be used to check whether it's safe to destroy a remote, or
	// whether doing so will cause a method to never resolve.
	public awaitAllMethodsRespondedTo() {
		return new Promise<void>(resolve => {
			if (this.numberUnrespondedToMethods === 0) {
				resolve();
			} else {
				this.noWaitingMethodsListeners.push(resolve);
			}
		});
	}

	// Should be called by subclasses when a message is received.
	protected async onMessage(message: SerializableData): Promise<void> {
		if (!(typeof message === 'object')) {
			throw new Error('Invalid message. Messages passed to onMessage must have type "object".');
		}

		if (Array.isArray(message)) {
			throw new Error('Message must be an object (is an array).');
		}

		if (typeof message.kind !== 'string') {
			throw new Error(`message.kind must be a string, was ${typeof message.kind}`);
		}

		if (!(message.kind in MessageType)) {
			throw new Error(`Invalid message type, ${message.kind}`);
		}

		// We just verified that message.kind is a MessageType,
		// assume that all other properties are valid.
		const asInternalMessage = message as InternalMessage;

		if (asInternalMessage.kind === MessageType.InvokeMethod) {
			await this.invokeLocalMethod(asInternalMessage);
		} else if (asInternalMessage.kind === MessageType.ReturnValueResponse) {
			await this.onRemoteResolve(asInternalMessage);
		} else if (asInternalMessage.kind === MessageType.ErrorResponse) {
			await this.onRemoteReject(asInternalMessage);
		} else if (asInternalMessage.kind === MessageType.RemoteReady) {
			await this.onRemoteReadyToReceive();
		} else {
			// Have TypeScipt verify that the above cases are exhaustive
			const exhaustivenessCheck: never = asInternalMessage;
			return exhaustivenessCheck;
		}
	}

	// Subclasses should call this method when ready to receive data
	protected onReadyToReceive() {
		if (this.isLocalReady) {
			return;
		}

		this.isLocalReady = true;
		this.postMessage({
			kind: MessageType.RemoteReady,
		});
	}

	protected abstract postMessage(message: InternalMessage): void;
}
