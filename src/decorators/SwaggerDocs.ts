import { ControllerMetadata, Giuseppe, HttpMethod, ParameterDefinition } from 'giuseppe';
import { GiuseppeApiController } from 'giuseppe/core/controller/GiuseppeApiController';
import { GiuseppeBodyParameter } from 'giuseppe/core/parameters/Body';
import { GiuseppeCookieParameter } from 'giuseppe/core/parameters/Cookie';
import { GiuseppeHeaderParameter } from 'giuseppe/core/parameters/Header';
import { GiuseppeQueryParameter } from 'giuseppe/core/parameters/Query';
import { GiuseppeUrlParameter } from 'giuseppe/core/parameters/UrlParam';
import { FunctionMethodDecorator, GiuseppeBaseRoute } from 'giuseppe/core/routes/GiuseppeBaseRoute';

import {
  Handler,
  JsonSchema,
  JsonSchemaArray,
  JsonSchemaObject,
  JsonSchemaObjects,
  JsonSchemaRef,
  Parameter,
  ParameterLocation,
  ParameterType,
  Response as JsonResponse,
  Responses,
  SwaggerDoc,
  SwaggerObjectData,
  SwaggerParameterData,
  SwaggerRouteData,
  SwaggerRouteResponses,
} from '../models/SwaggerDoc';
import { getMetadata } from '../utils/metadata';

export interface SwaggerDocsOptions {
    info: {
        title: string;
        version: string;
        description: string;
    };
}

export function SwaggerDocs(route: string, options: SwaggerDocsOptions): FunctionMethodDecorator {
    return (target: Object, _name: string | symbol, descriptor: TypedPropertyDescriptor<Function>) => {
        if (!descriptor.value) {
            throw new TypeError(`Function is undefined in route ${route}`);
        }
        Giuseppe.registrar.registerRoute(target, new SwaggerDocsRoute(route, options));
    };
}

function getParameterLocation(param: ParameterDefinition): ParameterLocation {
    if (param as any instanceof GiuseppeBodyParameter) {
        return 'query';
    } else if (param as any instanceof GiuseppeQueryParameter) {
        return 'query';
    } else if (param as any instanceof GiuseppeCookieParameter) {
        return 'cookie';
    } else if (param as any instanceof GiuseppeHeaderParameter) {
        return 'header';
    } else if (param as any instanceof GiuseppeUrlParameter) {
        return 'path';
    } else {
        throw new Error(`Unknown parameter location: ${param.constructor.name}`);
    }
}

function preSlash(str: string): string {
    return str ? `${/^\//.test(str) ? '' : '/'}${str}` : '';
}

const PRIMITIVE_TYPES: Function[] = [String, Boolean, Number];

function getPrimitiveType(type: Function): ParameterType | undefined {
    if (PRIMITIVE_TYPES.indexOf(type) > -1) {
        return type.name.toLowerCase() as ParameterType;
    }
}

export class SwaggerDocsRoute extends GiuseppeBaseRoute {

    private swagger: SwaggerDoc;

    constructor(route: string = '', private options: SwaggerDocsOptions) {
        super(HttpMethod.get, () => this.getSwagger(), route);
    }

    private getSwagger(): SwaggerDoc {
        if (!this.swagger) {
            this.swagger = this.buildSwagger();
        }
        return this.swagger;
    }

    private buildSwagger(): SwaggerDoc {
        const paths = {};
        const definitions: JsonSchemaObjects = {};

        for (const controller of Giuseppe.registrar.controller) {
            const controllerMeta = new ControllerMetadata(controller.ctrlTarget.prototype);

            if (!(controller instanceof GiuseppeApiController)) {
                throw new Error(`SwaggerDocsController: unknown controller type: ${typeof controller}.`);
            }

            const giuseppeApiController = controller as GiuseppeApiController;

            for (const route of controllerMeta.routes()) {
                const swaggerRouteData: SwaggerRouteData = (route as any).swagger;

                if (!swaggerRouteData) {
                    continue;
                }

                const url = `${preSlash(giuseppeApiController.routePrefix)}${preSlash(route.route)}`;
                const methodName = HttpMethod[route.httpMethod];

                if (!paths[url]) {
                    paths[url] = {};
                }
                paths[url][methodName] = this.buildHandler(
                    definitions,
                    swaggerRouteData,
                    controllerMeta.parameters(route.name),
                );
            }
        }

        const docs: SwaggerDoc = {
            paths,
            definitions,
            info: this.options.info,
            consumes: ['application/json'],
            produces: ['application/json'],
            swagger: '2.0',
        };

        return docs;
    }

    private buildHandler(
        definitions: JsonSchemaObjects,
        data: SwaggerRouteData,
        parameterDefinitions: ParameterDefinition[],
    ): Handler {

        const handler: Handler = {
            description: data.description,
            responses: this.buildResponses(definitions, data.responses),
            produces: ['application/json'],
            parameters: this.buildParameters(definitions, parameterDefinitions),
        };

        return handler;
    }

    private buildResponses(definitions: JsonSchemaObjects, responseDefinitions: SwaggerRouteResponses): Responses {
        const responses = {};

        for (const code of Object.keys(responseDefinitions)) {
            const responseDefinition = responseDefinitions[code];
            const response: JsonResponse = {
                description: responseDefinition.description,
            };

            if (responseDefinition.type) {
                response.schema = {
                    $ref: `#/definitions/${responseDefinition.type.name}`,
                };

                this.registerType(definitions, responseDefinition.type);
            }

            responses[code] = response;
        }

        return responses;
    }

    private registerType(definitions: JsonSchemaObjects, type: Function): void {
        if (definitions[type.name] || getPrimitiveType(type)) {
            return;
        }

        const properties = {};
        const required: string[] = [];
        const toRegister: Function[] = [];
        let description;

        const objectData: SwaggerObjectData = getMetadata(type.prototype);
        if (objectData) {
            description = objectData.description;

            for (const name of Object.keys(objectData.fields)) {
                if (!objectData.fields) {
                    continue;
                }

                const field = objectData.fields[name];


                properties[name] = this.buildField(name, field.type, type);

                if (field.type) {
                    toRegister.push(field.type);
                }

                if (field.required) {
                    required.push(name);
                }
            }
        }

        const definition: JsonSchemaObject = {
            description,
            properties,
            required,
            type: 'object',
            id: type.name,
        };

        definitions[type.name] = definition;

        toRegister.forEach(type => this.registerType(definitions, type));
    }

    private buildField(name: string, type: Function | undefined, objectType: Function): JsonSchema {
        const baseType: Function = Reflect.getMetadata('design:type', objectType.prototype, name);
        const primitiveType = getPrimitiveType(baseType);
        if (primitiveType) {
            return {
                type: primitiveType,
            } as any;
        }

        if (type) {
            return this.buildTypeSchema(baseType, type);
        }

        throw new Error('Invalid field.');
    }

    private buildTypeSchema(baseType: Function, type: Function): JsonSchemaArray | JsonSchemaRef {
        const primitiveType = getPrimitiveType(type);
        let leafSchema;
        if (primitiveType) {
            leafSchema = {
                type: primitiveType,
            };
        } else {
            leafSchema = {
                $ref: `#/definitions/${type.name}`,
            };
        }

        if (baseType === Array) {
            return {
                type: 'array',
                items: leafSchema,
            };
        }

        return leafSchema;
    }

    private buildParameters(definitions: JsonSchemaObjects, parameterDefinitions: ParameterDefinition[]): Parameter[] {
        const parameters: Parameter[]  = [];

        for (const parameter of parameterDefinitions) {
            try {
                parameters.push(this.buildParameter(definitions, parameter));
            } catch (e) {
                throw new Error(`Invalid parameter type: ${e.message}`);
            }
        }

        return parameters;
    }

    private buildParameter(definitions: JsonSchemaObjects, parameter: ParameterDefinition): Parameter {
        const param: Parameter = {
            name: parameter.name,
            in: getParameterLocation(parameter),
            required: parameter['required'],
        };

        const primitiveType = getPrimitiveType(parameter.type);
        if (primitiveType) {
            param.type = primitiveType;
        }

        const swaggerParamData: SwaggerParameterData = (parameter as any).swagger;

        if (swaggerParamData) {
            param.default = swaggerParamData.default;
            param.description = swaggerParamData.description;

            if (swaggerParamData.type) {
                param.schema = this.buildTypeSchema(parameter.type, swaggerParamData.type);
                this.registerType(definitions, swaggerParamData.type);
            }
        }

        return param;
    }
}

