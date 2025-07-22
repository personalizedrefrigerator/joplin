
// See https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-2.html
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- needed to polyfill a read-only property
(Symbol as any).asyncDispose ??= Symbol('Symbol.asyncDispose');
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- needed to polyfill a read-only property
(Symbol as any).dispose ??= Symbol('Symbol.dispose');
