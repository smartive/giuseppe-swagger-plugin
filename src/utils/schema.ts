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

export function buildLeafSchema(
    type: JsonSchema|Function|[Function],
    path: string,
): { schema: JsonSchema, toRegister: Function[] } {
    if (typeof type === 'object') {
        return {
            schema: type as JsonSchema,
            toRegister: [],
        };
    }

    if (type instanceof Array) {
        const schema = buildLeafSchema(type[0], path);
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
            $ref: path ? `#${path}/${type.name}` : type.name,
        },
        toRegister: [type],
    };
}

export function buildTypeSchema(
    path: string,
    field: SwaggerFieldData,
    baseType: Function,
    type?: Function,
): { schema: JsonSchema, toRegister: Function[] } {
    const leafSchema = type ? buildLeafSchema(type, path) : buildLeafSchema(baseType, path);

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

export function registerType(definitions: JsonSchemaObjects, type: Function, path: string, swagger2: boolean = false): void {
    if (definitions[type.name] || getPrimitiveType(type)) {
        return;
    }

    const typesToRegister: Function[] = [];
    const definition = {
        id: path ? type.name : `#${type.name}`,
    } as any;

    const objectData: SwaggerObjectData = getMetadata(type.prototype);
    if (objectData) {
        definition.description = objectData.description;

        if (objectData.oneOf) {
            if (swagger2) {
                const type = objectData.oneOf[objectData.oneOf.length - 1];
                definition.$ref = path ? `#${path}/${type.name}` : type.name;
                typesToRegister.push(type);
            } else {
                definition.oneOf = objectData.oneOf.map(type => ({
                    $ref: path ? `#${path}/${type.name}` : type.name,
                }));
                objectData.oneOf.forEach(type => typesToRegister.push(type));
            }
        } else {
            if (objectData.nullable) {
                definition.type = ['null', 'object'];
            } else {
                definition.type = 'object';
            }

            if (objectData.additionalPropertiesType) {
                definition.additionalProperties = {
                    $ref: path
                        ? `#${path}/${objectData.additionalPropertiesType.name}` : objectData.additionalPropertiesType.name,
                };
                typesToRegister.push(objectData.additionalPropertiesType);
            }

            if (objectData.fields && Object.keys(objectData.fields).length) {
                definition.properties = {};

                for (const name of Object.keys(objectData.fields)) {

                    const field = objectData.fields[name];

                    const { schema, toRegister } = buildField(name, field, type, path, swagger2);
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

    typesToRegister.forEach(type => registerType(definitions, type, path, swagger2));
}

function transformSchemaToSwagger2(schema: any): JsonSchema {
    if (typeof schema !== 'object') {
        return schema;
    }

    if (schema.oneOf) {
        if (schema.oneOf.every(item => item.pattern)) {
            return {
                type: 'string',
                pattern: schema.oneOf.map(item => `(${item.pattern})`).join('|'),
            };
        }

        return transformSchemaToSwagger2(schema.oneOf[schema.oneOf.length - 1]);
    }

    const newSchema = { ...schema };

    if (newSchema.items) {
        newSchema.items = transformSchemaToSwagger2(newSchema.items);
    }

    if (newSchema.additionalProperties) {
        newSchema.additionalProperties = transformSchemaToSwagger2(newSchema.additionalProperties);
    }

    return newSchema;
}

export function buildField(
    name: string,
    field: SwaggerFieldData,
    objectType: Function,
    path: string,
    swagger2: boolean = false,
): {
    schema: JsonSchema,
    toRegister?: Function[],
} {
    try {
        if (field.schema) {
            if (swagger2) {
                return {
                    schema: transformSchemaToSwagger2(field.schema),
                };
            }
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
            if (swagger2) {
                return buildLeafSchema(field.types[field.types.length - 1], path);
            }

            const schemas = field.types.map(type => buildLeafSchema(type, path));
            let types = schemas.map(schema => schema.schema);

            if (field.nullable) {
                types = [{ type: 'null' }, ...types];
            }

            return {
                schema: {
                    oneOf: types,
                },
                toRegister: schemas.map(schema => schema.toRegister)
                    .reduce((flat, arr) => (flat.push(...arr), flat), []),
            };
        }

        if (field.items) {
            const itemsBuild = buildField(name, field.items, objectType, path, swagger2);
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
            return buildTypeSchema(path, field, baseType, field.type);
        }

        const primitiveType = getPrimitiveType(baseType);
        if (primitiveType) {
            const schema: any = {
                type: primitiveType,
            };
            if (field.pattern) {
                schema.pattern = patternToString(field.pattern);
            }
            if (field.minLength !== undefined) {
                schema.minLength = field.minLength;
            }
            if (field.maxLength !== undefined) {
                schema.maxLength = field.maxLength;
            }
            if (field.minimum !== undefined) {
                schema.minimum = field.minimum;
            }
            if (field.maximum !== undefined) {
                schema.maximum = field.maximum;
            }
            if (field.nullable) {
                schema.type = ['null', schema.type];
            }

            return  {
                schema,
            };
        }

        return buildTypeSchema(path, field, baseType);
    } catch (e) {
        throw new Error(`Error in ${name}: ${e.message}`);
    }
}

export function buildDefinitions(type: Function, swagger2: boolean = false): JsonSchemaObjects {
    const schema = {
    };
    registerType(schema, type, '', swagger2);
    return schema;
}

export function buildSchema(type: Function, swagger2: boolean = false): JsonSchemaObjects {
    const schema = buildDefinitions(type, swagger2);
    (schema as any).$schema = 'http://json-schema.org/draft-04/schema#';
    (schema as any).id = 'schema';
    return schema;
}
