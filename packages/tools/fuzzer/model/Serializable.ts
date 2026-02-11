import { hasOwnProperty } from "@joplin/utils/object";

type StringTypePrimitive = 'string'|'boolean'|'number';
type StringType = StringTypePrimitive|`${StringTypePrimitive}[]`;
export type BaseSchema = {
	[key: string]: StringType | BaseSchema | BaseSchema[],
};

type TypeMap = {
	'string': string,
	'boolean': boolean,
	'number': number,
	'string[]': string[],
	'boolean[]': boolean[],
	'number[]': number[],
};

export type SchemaToType<Schema extends BaseSchema> = {
	[key in keyof Schema]:
		Schema[key] extends StringType
			? TypeMap[Schema[key]]
			: Schema[key] extends BaseSchema
			? SchemaToType<Schema[key]>
			: never
};

const deserializeFromSchema = <Schema extends BaseSchema> (schema: Schema, data: unknown): SchemaToType<Schema> => {
	const errorContext = () => `(deserializing ${JSON.stringify(data)})`;
	if (typeof data !== 'object') {
		throw new Error(`Cannot deserialize non-object ${errorContext()}`);
	}

	const result = Object.create(null);
	for (const [key, subSchema] of Object.entries(schema)) {
		if (!hasOwnProperty(data, key)) {
			throw new Error(`Cannot deserialize: Missing property ${JSON.stringify(key)} ${errorContext()}`);
		}

		if (typeof subSchema === 'string') {
			if (typeof data[key] !== subSchema) {
				throw new Error(`Invalid type: ${typeof data[key]}. Expected ${subSchema} ${errorContext()}`);
			}

			result[key] = data[key];
		} else if (Array.isArray(subSchema)) {
			if (!Array.isArray(data[key])) {
				throw new Error(`Invalid type: ${typeof data[key]}. Expected array. ${errorContext()}`);
			}

			result[key] = [];
			for (let i = 0; i < subSchema.length; i++) {
				result[key].push(deserializeFromSchema(subSchema[i], data[i]));
			}
		} else {
			result[key] = deserializeFromSchema(subSchema, data[key]);
		}
	}
	return result;
}

export default abstract class Serializable<Schema extends BaseSchema> {
	protected constructor(private schema_: Schema) {}

	public abstract serialize(): SchemaToType<Schema>;
	protected deserialize(data: unknown): SchemaToType<Schema> {
		return deserializeFromSchema(this.schema_, data);
	}
}
