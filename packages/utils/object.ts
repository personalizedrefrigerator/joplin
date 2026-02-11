// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
export const objectValueFromPath = (o: any, path: string) => {
	const elements = path.split('.');
	let result = { ...o };
	while (elements.length && result) {
		const e = elements.splice(0, 1)[0];
		result = result[e];
	}
	return result;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
export function checkObjectHasProperties(object: any, properties: string[]) {
	for (const prop of properties) {
		if (!(prop in object)) throw new Error(`Missing property "${prop}": ${JSON.stringify(object)}`);
	}
}

export const hasOwnProperty = <T extends object, Property extends string>(
	object: T, property: Property
): object is T & Record<Property, unknown> => {
	return !!object && Object.prototype.hasOwnProperty.call(object, property);
};

type TypeNameToType = {
	'string': string,
	'number': number,
	'object': object,
	'boolean': boolean,
	'string[]': string[],
	'unknown[]': unknown[],
	'unknown[][]': unknown[][],
	'unknown': unknown,
};

// Asserts that the given item is 1) an object 2) has the given property and
// 3) the property is of the expected type
export function assertHasOwnPropertyOfType<
	OriginalType,
	Property extends string,
	TypeName extends keyof TypeNameToType,
	OutputType extends TypeNameToType[TypeName]
>(
	object: OriginalType,
	prop: Property,
	type: TypeName,
): asserts object is OriginalType & Record<Property, OutputType> {
	if (typeof object !== 'object' || object === null) {
		throw new Error(`Expected a non-null object. Got ${JSON.stringify(object)}`);
	}

	if (!hasOwnProperty(object, prop)) {
		throw new Error(`Missing property "${prop}": ${JSON.stringify(object)}`);
	}

	const getErrorMessage = () => `Wrong type for property: "${prop}" (expected array): ${JSON.stringify(object)}`;

	if (type === 'unknown') {
		// No check required
	} else if (type === 'unknown[]' || type === 'unknown[][]' || type === 'string[]') {
		if (!Array.isArray(object[prop])) {
			throw new Error(getErrorMessage());
		}

		if (type === 'string[]' || type === 'unknown[][]') {
			for (const item of object[prop]) {
				const stringTypeMismatch = type === 'string' && typeof item !== 'string';
				const arrayTypeMismatch = type === 'unknown[][]' && !Array.isArray(item);
				if (stringTypeMismatch || arrayTypeMismatch) {
					throw new Error(getErrorMessage());
				}
			}
		}
	} else if (typeof object[prop] !== type) {
		throw new Error(getErrorMessage());
	} else {
		throw new Error(`Unknown type to check for: ${type}`);
	}
}


