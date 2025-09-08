export interface Size {
	width?: number;
	height?: number;
}

export interface Link {
	title: string;
	url: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Using `any` to specify an upper bound. Only use for "extends" checks:
type AnyFunction = (...args: any)=> any;

// The return type of `Type`, wrapped in a function
export type AsyncReturnTypeOf<Type extends AnyFunction> = Promise<Awaited<ReturnType<Type>>>;

export type FunctionPropertiesOf<T extends object> = {
	// Ref:
	// - The "Methods<T>" type defined in https://github.com/microsoft/TypeScript/pull/40336's examples.
	// - This StackOverflow thread: https://stackoverflow.com/a/69756175
	[key in keyof T as T[key] extends AnyFunction ? key : never]: T[key]
};
