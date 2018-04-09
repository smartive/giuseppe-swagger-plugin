import { buildLeafSchema, getPrimitiveType, registerType } from '../utils/schema';
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
  JsonSchemaObjects,
  JsonSchemaRef,
  Parameter,
  ParameterLocation,
  Response as JsonResponse,
  Responses,
  SwaggerDoc,
  SwaggerParameterData,
  SwaggerRouteData,
  SwaggerRouteResponses,
} from '../models/SwaggerDoc';

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

function routeComponent(str: string): string {
    if (!str) {
        return '';
    }

    let component = str[0] === '/' ? str.substr(1) : str;

    if (component[0] === ':') {
        component = `{${component.substr(1)}}`;
    }

    return `/${component}`;
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

                const url = `${routeComponent(giuseppeApiController.routePrefix)}${routeComponent(route.route)}`;
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

                registerType(definitions, responseDefinition.type);
            }

            responses[code] = response;
        }

        return responses;
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
            param.minimum = swaggerParamData.minimum;
            param.maximum = swaggerParamData.maximum;
            param.deprecated = swaggerParamData.deprecated;
            param.enum = swaggerParamData.enum;

            if (swaggerParamData.type) {
                const leafSchema = buildLeafSchema(swaggerParamData.type);

                if (parameter.type === Array) {
                    param.type = 'array';
                    param.items = leafSchema.schema;
                } else {
                    param.schema = leafSchema.schema as JsonSchemaRef;
                }

                leafSchema.toRegister.map(type => registerType(definitions, type));
            }
        }

        return param;
    }
}
