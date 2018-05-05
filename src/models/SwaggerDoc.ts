export interface SwaggerDoc {
    info: {
        title: string;
        description: string;
        version: string;
    };
    consumes: MimeType[];
    produces: MimeType[];
    swagger: string;
    paths: {
        [path: string]: Path;
    };
    definitions: JsonSchemaObjects;
}

export interface Path {
    [method: string]: Handler;
}

export interface Parameter {
    name: string;
    deprecated?: boolean;
    description?: string;
    in: ParameterLocation;
    required?: boolean;
    type?: ParameterType;
    items?: JsonSchema;
    enum?: string[];
    default?: string | number;
    minimum?: number;
    maximum?: number;
    schema?: JsonSchemaRef;
}

export interface Handler {
    description: string;
    produces: MimeType[];
    parameters: Parameter[];
    responses: Responses;
}

export type ParameterType = 'string' | 'boolean' | 'number' | 'array';

export type ParameterLocation = 'query' | 'header' | 'path' | 'cookie';

export type MimeType = 'application/json';

export interface SwaggerRouteData {
    description: string;
    responses: SwaggerRouteResponses;
}

export interface SwaggerRouteResponses {
    [code: string]: {
        description: string;
        type?: Function;
    };
}

export interface Responses {
    [code: string]: Response;
}

export interface Response {
    description: string;
    schema?: JsonSchema;
}

export interface JsonSchemaObjects {
    [name: string]: JsonSchemaObject | JsonSchemaObjects;
}

export type JsonSchema =
    JsonSchemaRef |
    JsonSchemaNull |
    JsonSchemaBoolean |
    JsonSchemaString |
    JsonSchemaNumber |
    JsonSchemaArray |
    JsonSchemaOneOf |
    JsonSchemaAnyOf |
    JsonSchemaEnum |
    JsonSchemaObject;

export interface JsonSchemaObject {
    id?: string;
    type: 'object' | ['null', 'object'];
    description?: string;
    properties: {
        [name: string]: JsonSchema;
    };
    patternProperties?: {
        [pattern: string]: JsonSchema;
    };
    required?: string[];
    additionalProperties?: boolean;
}

export interface JsonSchemaRef {
    description?: string;
    $ref: string;
}

export interface JsonSchemaNull {
    description?: string;
    type: 'null';
}

export interface JsonSchemaBoolean {
    description?: string;
    type: 'boolean';
}

export interface JsonSchemaString {
    description?: string;
    type: 'string' | ['null', 'string'];
    minLength?: number;
    maxLength?: number;
    pattern?: string;
}

export interface JsonSchemaNumber {
    description?: string;
    type: 'number';
    minimum?: number;
    maximum?: number;
    multipleOf?: number;
}

export interface JsonSchemaArray {
    description?: string;
    type: 'array' | ['null', 'array'];
    items: JsonSchema;
    minLength?: number;
    uniqueItems?: boolean;
}

export interface JsonSchemaOneOf {
    description?: string;
    oneOf: any[];
}

export interface JsonSchemaAnyOf {
    description?: string;
    anyOf: any[];
}

export interface JsonSchemaEnum {
    description?: string;
    enum: string[] | number[];
}

export interface SwaggerParameterData {
    description?: string;
    default?: any;
    type?: Function;
    deprecated?: boolean;
    minimum?: number;
    maximum?: number;
    enum?: any[];
}

export interface SwaggerObjectData {
    description?: string;
    fields?: {
        [name: string]: SwaggerFieldData;
    };
    additionalPropertiesType?: Function;
    nullable?: boolean;
    additionalProperties?: boolean;
    oneOf?: Function[];
}

export interface SwaggerFieldData {
    schema?: JsonSchema;
    type?: Function;
    types?: (JsonSchema|Function|[Function])[];
    required?: boolean;
    enum?: string[] | number[];
    nullable?: boolean;
    pattern?: RegExp;
    minLength?: number;
    maxLength?: number;
    minimum?: number;
    maximum?: number;
    multipleOf?: number;
    uniqueItems?: boolean;
    items?: SwaggerFieldData;
}
