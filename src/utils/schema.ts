import {
    JsonSchema,
    JsonSchemaArray,
    JsonSchemaObjects,
    ParameterType,
    SwaggerFieldData,
    SwaggerObjectData,
} from '../models/SwaggerDoc';
import { getMetadata } from './metadata';

const PRIMITIVE_TYPES: Function[] = [String, Boolean, Number];

export function getPrimitiveType(type: Function): ParameterType | undefined {
    if (PRIMITIVE_TYPES.indexOf(type) > -1) {
        return type.name.toLowerCase() as ParameterType;
    }
}

function patternToString(pattern: RegExp): string {
    const str = pattern.toString();
    return str.substring(1, str.length - 1);
}

export function buildLeafSchema(type: Function|[Function]): { schema: JsonSchema, toRegister: Function[] } {
    if (type instanceof Array) {
        const schema = buildLeafSchema(type[0]);
        return {
            schema: {
                type: 'array',
                items: schema.schema,
            },
            toRegister: schema.toRegister,
        };
    }
    const primitiveType = getPrimitiveType(type);
    if (primitiveType) {
        return {
            schema: {
                type: primitiveType,
            } as JsonSchema,
            toRegister: [],
        };
    }

    return {
        schema: {
            $ref: `#${type.name}`,
        },
        toRegister: [type],
    };
}

export function buildTypeSchema(
    field: SwaggerFieldData,
    baseType: Function,
    type?: Function,
): { schema: JsonSchema, toRegister: Function[] } {
    const leafSchema = type ? buildLeafSchema(type) : buildLeafSchema(baseType);

    if (baseType === Array) {
        if (!type) {
            throw new Error(`Array field requires item type.`);
        }

        const schema: JsonSchemaArray = {
            type: 'array',
            items: leafSchema.schema,
        };

        if (field.minLength) {
            schema.minLength = field.minLength;
        }

        if (field.pattern) {
            (schema.items as any).pattern = patternToString(field.pattern);
        }

        if (field.nullable) {
            schema.type = ['null', 'array'];
        }

        if (field.uniqueItems) {
            schema.uniqueItems = true;
        }

        return {
            schema,
            toRegister: leafSchema.toRegister,
        };
    }

    return leafSchema;
}

export function registerType(definitions: JsonSchemaObjects, type: Function): void {
    if (definitions[type.name] || getPrimitiveType(type)) {
        return;
    }

    const typesToRegister: Function[] = [];
    const definition = {
        id: `#${type.name}`,
    } as any;

    const objectData: SwaggerObjectData = getMetadata(type.prototype);
    if (objectData) {
        definition.description = objectData.description;

        if (objectData.oneOf) {
            definition.oneOf = objectData.oneOf.map(type => ({
                $ref: `#${type.name}`,
            }));

            objectData.oneOf.forEach(type => typesToRegister.push(type));
        } else {
            if (objectData.nullable) {
                definition.type = ['null', 'object'];
            }

            if (objectData.additionalPropertiesType) {
                definition.additionalProperties = {
                    $ref: `#${objectData.additionalPropertiesType.name}`,
                };
                typesToRegister.push(objectData.additionalPropertiesType);
            }

            if (objectData.fields && Object.keys(objectData.fields).length) {
                definition.properties = {};

                for (const name of Object.keys(objectData.fields)) {

                    const field = objectData.fields[name];

                    const { schema, toRegister } = buildField(name, field, type);
                    definition.properties[name] = schema;

                    if (toRegister) {
                        typesToRegister.push(...toRegister);
                    }

                    if (field.required) {
                        if (!definition.required) {
                            definition.required = [];
                        }
                        definition.required.push(name);
                    }
                }
            }

            if (objectData.additionalProperties !== undefined) {
                definition.additionalProperties = objectData.additionalProperties;
            }
        }

    }

    definitions[type.name] = definition;

    typesToRegister.forEach(type => registerType(definitions, type));
}

export function buildField(
    name: string,
    field: SwaggerFieldData,
    objectType: Function,
): {
    schema: JsonSchema,
    toRegister?: Function[],
} {
    try {
        if (field.schema) {
            return {
                schema: field.schema,
            };
        }

        if (field.enum) {
            return {
                schema: {
                    enum: field.enum,
                },
            };
        }

        if (field.types) {
            const schemas = field.types.map(buildLeafSchema);
            let types = schemas.map(schema => schema.schema);

            if (field.nullable) {
                types = [{ type: 'null' }, ...types];
            }

            return {
                schema: {
                    anyOf: types,
                },
                toRegister: schemas.map(schema => schema.toRegister)
                    .reduce((flat, arr) => (flat.push(...arr), flat), []),
            };
        }

        if (field.items) {
            const itemsBuild = buildField(name, field.items, objectType);
            return {
                schema: {
                    type: 'array',
                    items: itemsBuild.schema,
                    uniqueItems: field.uniqueItems,
                },
                toRegister: itemsBuild.toRegister,
            };
        }

        const baseType: Function = Reflect.getMetadata('design:type', objectType.prototype, name);
        if (field.type) {
            return buildTypeSchema(field, baseType, field.type);
        }

        const primitiveType = getPrimitiveType(baseType);
        if (primitiveType) {
            const schema: any = {
                type: primitiveType,
            };
            if (field.pattern) {
                schema.pattern = patternToString(field.pattern);
            }
            if (field.minLength) {
                schema.minLength = field.minLength;
            }
            if (field.maxLength) {
                schema.maxLength = field.maxLength;
            }
            if (field.maximum) {
                schema.maximum = field.maximum;
            }
            if (field.nullable) {
                schema.type = ['null', schema.type];
            }

            return  {
                schema,
            };
        }

        return buildTypeSchema(field, baseType);
    } catch (e) {
        throw new Error(`Error in ${name}: ${e.message}`);
    }
}

export function buildDefinitions(type: Function): JsonSchemaObjects {
    const schema = {
        $schema: 'http://json-schema.org/draft-04/schema#',
        id: 'schema',
    };
    registerType(schema, type);
    return schema;
}
