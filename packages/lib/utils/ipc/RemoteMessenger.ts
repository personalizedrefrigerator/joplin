import { CallbackArguments, SerializableData, SerializableDataAndCallbacks, TransferableCallback } from './types';
import mergeCallbacksAndArgs from './utils/mergeCallbacksAndArgs';
import separateCallbacksFromArgs from './utils/separateCallbacksFromArgs';

enum MessageType {
	RemoteReady = 'RemoteReady',
	InvokeMethod = 'InvokeMethod',
	ErrorResponse = 'ErrorResponse',
	ReturnValueResponse = 'ReturnValueResponse',
	CloseChannel = 'CloseChannel',
}

type RemoteReadyMessage = Readonly<{
	kind: MessageType.RemoteReady;
}>;

type InvokeMethodMessage = Readonly<{
	kind: MessageType.InvokeMethod;

	respondWithId: string;
	methodPath: string[];
	arguments: SerializableData[];

	// Stores identifiers for callbacks within the normal `arguments`.
	// For example,
	// 	[{ foo: 'some-id-here' }, null, 'some-id-here-2']
	// means that the first argument has a property named "foo" that is a function
	// and the third argument is also a function.
	eventHandlerArguments: CallbackArguments[];
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

// Disconnect
type CloseChannelMessage = Readonly<{
	kind: MessageType.CloseChannel;
}>;

type BaseMessage = Readonly<{
	channelId: string;
}>;

type InternalMessage = (RemoteReadyMessage|CloseChannelMessage|InvokeMethodMessage|ErrorResponse|ReturnValueResponse) & BaseMessage;

// Listeners for a remote method to resolve or reject.
type OnMethodResolveListener = (returnValue: SerializableData)=> void;
type OnMethodRejectListener = (errorMessage: string)=> void;
type OnRemoteReadyListener = ()=> void;

type OnAllMethodsRespondedToListener = ()=> void;

// A thin wrapper around postMessage. A script within `targetWindow` should
// also construct a RemoteMessenger (with IncomingMessageType and
// OutgoingMessageType reversed).
export default abstract class RemoteMessenger<LocalInterface, RemoteInterface> {
	private resolveMethodCallbacks: Record<string, OnMethodResolveListener> = Object.create(null);
	private rejectMethodCallbacks: Record<string, OnMethodRejectListener> = Object.create(null);
	private argumentCallbacks: Map<string, TransferableCallback> = new Map();

	private numberUnrespondedToMethods = 0;
	private noWaitingMethodsListeners: OnAllMethodsRespondedToListener[] = [];

	private remoteReadyListeners: OnRemoteReadyListener[] = [];
	private isRemoteReady = false;
	private isLocalReady = false;
	private nextResponseId = 0;
	private closed = false;

	// If true, we'll be ready to receive data after .setLocalInterface is next called.
	private waitingForLocalInterface = false;

	public readonly remoteApi: RemoteInterface;

	// True if remoteApi methods should be called with `.apply(thisVariable, ...)` to preserve
	// the value of `this`.
	// Having `preserveThis` set to `true` may be problematic if chaining messengers. If chaining,
	// set `preserveThis` to false.
	private preserveThis = true;

	// channelId should be the same as the id of the messenger this will communicate with.
	//
	// If localInterface is null, .setLocalInterface must be called.
	// This allows chaining multiple messengers together.
	public constructor(private channelId: string, private localInterface: LocalInterface|null) {
		const makeApiFor = (methodPath: string[]) => {
			// Use a function as the base object so that .apply works.
			const baseObject = () => {};

			return new Proxy(baseObject, {
				// Map all properties to functions that invoke remote
				// methods.
				get: (_target, property: string): any => {
					if (property === '___is_joplin_wrapper___') {
						return true;
					} else {
						return makeApiFor([...methodPath, property]);
					}
				},
				apply: (_target, _thisArg, argumentsList: SerializableDataAndCallbacks[]) => {
					return this.invokeRemoteMethod(methodPath, argumentsList);
				},
			});
		};
		this.remoteApi = makeApiFor([]) as RemoteInterface;
	}

	private createResponseId(methodPath: string[]) {
		return `${methodPath.join(',')}-${this.nextResponseId++}`;
	}

	private async invokeRemoteMethod(methodPath: string[], args: SerializableDataAndCallbacks[]) {
		// Function arguments can't be transferred using standard .postMessage calls.
		// As such, we assign them IDs and transfer the IDs instead:
		const separatedArgs = separateCallbacksFromArgs(args);
		for (const id in separatedArgs.idToCallbacks) {
			this.argumentCallbacks.set(id, separatedArgs.idToCallbacks[id]);
		}

		// Wait for the remote to be ready to receive before
		// actually sending a message.
		this.numberUnrespondedToMethods ++;
		await this.awaitRemoteReady();

		return new Promise<SerializableData>((resolve, reject) => {
			const responseId = this.createResponseId(methodPath);

			this.resolveMethodCallbacks[responseId] = returnValue => {
				resolve(returnValue);
			};
			this.rejectMethodCallbacks[responseId] = (errorMessage: string) => {
				reject(errorMessage);
			};

			this.postMessage({
				kind: MessageType.InvokeMethod,

				methodPath,
				arguments: separatedArgs.argsWithoutCallbacks,
				eventHandlerArguments: separatedArgs.callbackArgs,
				respondWithId: responseId,

				channelId: this.channelId,
			});
		});
	}

	private canRemoteAccessProperty(parentObject: any, methodName: string) {
		// TODO: There may be a better way to do this -- this currently assumes that
		//       **only** the following property names should be avoided.
		// The goal here is primarially to prevent remote from accessing the Function
		// constructor (which can lead to XSS).
		const isSafeMethodName = !['constructor', 'prototype', '__proto__'].includes(methodName);
		if (!isSafeMethodName) {
			return false;
		}

		// Function.contructor can be used to eval code. Avoid it.
		if (parentObject[methodName] === Function.constructor) {
			return false;
		}

		return true;
	}

	// Calls a local method and sends the result to the remote connection.
	private async invokeLocalMethod(message: InvokeMethodMessage) {
		try {
			const methodFromPath = (path: string[]) => {
				const parentObjectStack: any[] = [];

				// We also use invokeLocalMethod to call callbacks that were previously
				// passed as arguments. In this case, path should be [ '__callbacks', callbackIdHere ].
				if (path.length === 2 && path[0] === '__callbacks' && this.argumentCallbacks.has(path[1])) {
					return {
						parentObject: undefined,
						parentObjectStack,
						method: this.argumentCallbacks.get(path[1]),
					};
				}

				let parentObject: any;
				let currentObject: any = this.localInterface;
				for (let i = 0; i < path.length; i++) {
					const propertyName = path[i];

					if (!this.canRemoteAccessProperty(currentObject, propertyName)) {
						throw new Error(`Cannot access property ${propertyName}`);
					}

					if (!currentObject[propertyName]) {
						const accessPath = path.map(part => `[${JSON.stringify(part)}]`).join('');
						throw new Error(`No such property ${JSON.stringify(propertyName)} on ${this.localInterface}. Accessing properties remoteApi${accessPath}.`);
					}

					parentObject = currentObject;
					parentObjectStack.push(parentObject);
					currentObject = currentObject[propertyName];
				}

				return { parentObject, parentObjectStack, method: currentObject };
			};

			const { method, parentObject, parentObjectStack } = methodFromPath(message.methodPath);

			if (typeof method !== 'function') {
				throw new Error(`Property ${message.methodPath.join('.')} is not a function.`);
			}

			const args = mergeCallbacksAndArgs(
				message.arguments,
				message.eventHandlerArguments,
				(callbackId: string, callbackArgs: SerializableData[]) => {
					return this.invokeRemoteMethod(['__callbacks', callbackId], callbackArgs);
				},
			);

			let result;
			if (this.preserveThis) {
				const lastMethodCallName = message.methodPath[message.methodPath.length - 1];
				const parentHasParent = parentObjectStack.length >= 2;

				// We need extra logic if the user is trying to .apply or .call a function.
				//
				// Specifically, if the user calls
				//     foo.apply(newThis, [some, args, here])
				// we want to remove the `.apply` to ensure that `foo` has the correct `this`
				// variable (and not some proxy object).
				//
				// We support this priarially because TypeScript can generate .call or .apply
				// when converting to ES5.
				if (
					parentHasParent
					&& ['call', 'apply'].includes(lastMethodCallName)
					&& typeof parentObject === 'function'
				) {
					let adjustedArgs = args;

					// Select [argsHere] from `.apply(newThis, [argsHere])`
					if (lastMethodCallName === 'apply' && Array.isArray(args[1])) {
						adjustedArgs = args[1];
					} else if (lastMethodCallName === 'call') {
						// Otherwise, we remove the `this` variable from `.call(newThis, args, go, here, ...)`.
						adjustedArgs = args.slice(1);
					}

					const newMethod = parentObject;
					const newParent = parentObjectStack[parentObjectStack.length - 2];
					result = await newMethod.apply(newParent, adjustedArgs);
				} else {
					result = await method.apply(parentObject, args);
				}
			} else {
				result = await method(...args);
			}

			this.postMessage({
				kind: MessageType.ReturnValueResponse,
				responseId: message.respondWithId,
				returnValue: result,
				channelId: this.channelId,
			});
		} catch (error) {
			console.error('Error: ', error, error.stack);

			this.postMessage({
				kind: MessageType.ErrorResponse,
				responseId: message.respondWithId,
				errorMessage: `${error}`,
				channelId: this.channelId,
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
		if (!this.resolveMethodCallbacks[message.responseId]) {
			throw new Error(`RemoteMessenger(${this.channelId}): Missing method callback with ID ${message.responseId}`);
		}

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
			this.postMessage({
				kind: MessageType.RemoteReady,
				channelId: this.channelId,
			});
		}
	}

	public awaitRemoteReady() {
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
		if (this.closed) {
			return;
		}

		if (!(typeof message === 'object')) {
			throw new Error(`Invalid message. Messages passed to onMessage must have type "object". Was type ${typeof message}.`);
		}

		if (Array.isArray(message)) {
			throw new Error('Message must be an object (is an array).');
		}

		if (typeof message.kind !== 'string') {
			throw new Error(`message.kind must be a string, was ${typeof message.kind}`);
		}

		// We just verified that message.kind is a MessageType,
		// assume that all other properties are valid.
		const asInternalMessage = message as InternalMessage;

		// If intended for a different set of messengers...
		if (asInternalMessage.channelId !== this.channelId) {
			return;
		}

		if (asInternalMessage.kind === MessageType.InvokeMethod) {
			await this.invokeLocalMethod(asInternalMessage);
		} else if (asInternalMessage.kind === MessageType.CloseChannel) {
			void this.onClose();
		} else if (asInternalMessage.kind === MessageType.ReturnValueResponse) {
			await this.onRemoteResolve(asInternalMessage);
		} else if (asInternalMessage.kind === MessageType.ErrorResponse) {
			await this.onRemoteReject(asInternalMessage);
		} else if (asInternalMessage.kind === MessageType.RemoteReady) {
			await this.onRemoteReadyToReceive();
		} else {
			// Have TypeScipt verify that the above cases are exhaustive
			const exhaustivenessCheck: never = asInternalMessage;
			throw new Error(`Invalid message type, ${message.kind}. Message: ${exhaustivenessCheck}`);
		}
	}

	// Subclasses should call this method when ready to receive data
	protected onReadyToReceive() {
		if (this.isLocalReady) {
			return;
		}

		if (this.localInterface === null) {
			this.waitingForLocalInterface = true;
			return;
		}

		this.isLocalReady = true;
		this.postMessage({
			kind: MessageType.RemoteReady,
			channelId: this.channelId,
		});
	}

	public setLocalInterface(localInterface: LocalInterface) {
		this.localInterface = localInterface;

		if (this.waitingForLocalInterface) {
			this.waitingForLocalInterface = false;
			this.onReadyToReceive();
		}
	}

	// Should be called if this messenger is in the middle (not on the edge) of a chain
	// For example, if we have the following setup,
	//    React Native <-Messenger(1) | Messenger(2)-> WebView <-Messenger(3) | Messenger(4)-> Worker
	// Messenger(2) and Messenger(3) should call `setIsChainedMessenger(false)`.
	public setIsChainedMessenger(isChained: boolean) {
		this.preserveThis = !isChained;
	}

	// Disconnects both this and the remote.
	public closeConnection() {
		this.closed = true;
		this.postMessage({ channelId: this.channelId, kind: MessageType.CloseChannel });
		this.onClose();
	}

	public hasBeenClosed() {
		return this.closed;
	}

	protected abstract postMessage(message: InternalMessage): void;
	protected abstract onClose(): void;
}