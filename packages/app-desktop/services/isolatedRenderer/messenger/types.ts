
// Data that can be sent/received by a RemoteMessenger
export type SerializableData =
	number|boolean|string|undefined|null|SerializableData[]|{ readonly [key: string]: SerializableData };

// This provides some amount of type checking for messenger APIs.
//
// While all parameters and return types must also extend SerializableData,
// there's no clear way to enforce this in TypeScript (most methods lead to
// a "missing index signature" error).
export type ReturnsPromises<Type> = {
	[functionName in keyof Type]: (...args: any[])=> Promise<any>;
};

