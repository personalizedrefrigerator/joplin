type Target = ((path: string, args: unknown[])=> unknown) & { __joplinNamespace?: string[] };

const handler: ProxyHandler<Target> = {};

handler.get = function(target, prop) {
	let t: Target = target;

	// There's probably a cleaner way to do this but not sure how. The idea is to keep
	// track of the calling chain current state. So if the user call `joplin.something.test("bla")`
	// we know we need to pass "joplin.something.test" with args "bla" to the target.
	// But also, if the user does this:
	//
	// const ns = joplin.view.dialogs;
	// await ns.create();
	// await ns.open();
	//
	// We need to know what "ns" maps to, so that's why call-specific context needs to be kept,
	// and the easiest way to do this is to create a new target when the call chain starts,
	// and attach a custom "__joplinNamespace" property to it.
	if (!t.__joplinNamespace) {
		const originalTarget = t;
		const newTarget: Target = (name, args) => {
			return originalTarget(name, args);
		};
		newTarget.__joplinNamespace = [prop as string];
		t = newTarget;
	} else {
		t.__joplinNamespace.push(prop as string);
	}

	return new Proxy(t, handler);
};

handler.apply = function(target, _thisArg, argumentsList) {
	const path = target.__joplinNamespace.join('.');
	target.__joplinNamespace.pop();
	return target(path, argumentsList);
};

// The Proxy mimics any object shape; callers pick the surface type (typically `Joplin`).
export default function sandboxProxy<T = unknown>(target: Target): T {
	return new Proxy(target, handler) as unknown as T;
}
