"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const giuseppe_1 = require("giuseppe");
const GiuseppeApiController_1 = require("giuseppe/core/controller/GiuseppeApiController");
const Body_1 = require("giuseppe/core/parameters/Body");
const Cookie_1 = require("giuseppe/core/parameters/Cookie");
const Header_1 = require("giuseppe/core/parameters/Header");
const Query_1 = require("giuseppe/core/parameters/Query");
const UrlParam_1 = require("giuseppe/core/parameters/UrlParam");
const GiuseppeBaseRoute_1 = require("giuseppe/core/routes/GiuseppeBaseRoute");
const metadata_1 = require("../utils/metadata");
function SwaggerDocs(route, options) {
    return (target, _name, descriptor) => {
        if (!descriptor.value) {
            throw new TypeError(`Function is undefined in route ${route}`);
        }
        giuseppe_1.Giuseppe.registrar.registerRoute(target, new SwaggerDocsRoute(route, options));
    };
}
exports.SwaggerDocs = SwaggerDocs;
function getParameterLocation(param) {
    if (param instanceof Body_1.GiuseppeBodyParameter) {
        return 'query';
    }
    else if (param instanceof Query_1.GiuseppeQueryParameter) {
        return 'query';
    }
    else if (param instanceof Cookie_1.GiuseppeCookieParameter) {
        return 'cookie';
    }
    else if (param instanceof Header_1.GiuseppeHeaderParameter) {
        return 'header';
    }
    else if (param instanceof UrlParam_1.GiuseppeUrlParameter) {
        return 'path';
    }
    else {
        throw new Error(`Unknown parameter location: ${param.constructor.name}`);
    }
}
function preSlash(str) {
    return str ? `${/^\//.test(str) ? '' : '/'}${str}` : '';
}
const PRIMITIVE_TYPES = [String, Boolean, Number];
function getPrimitiveType(type) {
    if (PRIMITIVE_TYPES.indexOf(type) > -1) {
        return type.name.toLowerCase();
    }
}
class SwaggerDocsRoute extends GiuseppeBaseRoute_1.GiuseppeBaseRoute {
    constructor(route = '', options) {
        super(giuseppe_1.HttpMethod.get, () => this.getSwagger(), route);
        this.options = options;
    }
    getSwagger() {
        if (!this.swagger) {
            this.swagger = this.buildSwagger();
        }
        return this.swagger;
    }
    buildSwagger() {
        const paths = {};
        const definitions = {};
        for (const controller of giuseppe_1.Giuseppe.registrar.controller) {
            const controllerMeta = new giuseppe_1.ControllerMetadata(controller.ctrlTarget.prototype);
            if (!(controller instanceof GiuseppeApiController_1.GiuseppeApiController)) {
                throw new Error(`SwaggerDocsController: unknown controller type: ${typeof controller}.`);
            }
            const giuseppeApiController = controller;
            for (const route of controllerMeta.routes()) {
                const swaggerRouteData = route.swagger;
                if (!swaggerRouteData) {
                    continue;
                }
                const url = `${preSlash(giuseppeApiController.routePrefix)}${preSlash(route.route)}`;
                const methodName = giuseppe_1.HttpMethod[route.httpMethod];
                if (!paths[url]) {
                    paths[url] = {};
                }
                paths[url][methodName] = this.buildHandler(definitions, swaggerRouteData, controllerMeta.parameters(route.name));
            }
        }
        const docs = {
            paths,
            definitions,
            info: this.options.info,
            consumes: ['application/json'],
            produces: ['application/json'],
            swagger: '2.0',
        };
        return docs;
    }
    buildHandler(definitions, data, parameterDefinitions) {
        const handler = {
            description: data.description,
            responses: this.buildResponses(definitions, data.responses),
            produces: ['application/json'],
            parameters: this.buildParameters(definitions, parameterDefinitions),
        };
        return handler;
    }
    buildResponses(definitions, responseDefinitions) {
        const responses = {};
        for (const code of Object.keys(responseDefinitions)) {
            const responseDefinition = responseDefinitions[code];
            const response = {
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
    registerType(definitions, type) {
        if (definitions[type.name] || getPrimitiveType(type)) {
            return;
        }
        const properties = {};
        const required = [];
        const toRegister = [];
        let description;
        const objectData = metadata_1.getMetadata(type.prototype);
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
        const definition = {
            description,
            properties,
            required,
            type: 'object',
            id: type.name,
        };
        definitions[type.name] = definition;
        toRegister.forEach(type => this.registerType(definitions, type));
    }
    buildField(name, type, objectType) {
        const baseType = Reflect.getMetadata('design:type', objectType.prototype, name);
        const primitiveType = getPrimitiveType(baseType);
        if (primitiveType) {
            return {
                type: primitiveType,
            };
        }
        if (type) {
            return this.buildTypeSchema(baseType, type);
        }
        throw new Error('Invalid field.');
    }
    buildTypeSchema(baseType, type) {
        const primitiveType = getPrimitiveType(type);
        let leafSchema;
        if (primitiveType) {
            leafSchema = {
                type: primitiveType,
            };
        }
        else {
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
    buildParameters(definitions, parameterDefinitions) {
        const parameters = [];
        for (const parameter of parameterDefinitions) {
            try {
                parameters.push(this.buildParameter(definitions, parameter));
            }
            catch (e) {
                throw new Error(`Invalid parameter type: ${e.message}`);
            }
        }
        return parameters;
    }
    buildParameter(definitions, parameter) {
        const param = {
            name: parameter.name,
            in: getParameterLocation(parameter),
            required: parameter['required'],
        };
        const primitiveType = getPrimitiveType(parameter.type);
        if (primitiveType) {
            param.type = primitiveType;
        }
        const swaggerParamData = parameter.swagger;
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
exports.SwaggerDocsRoute = SwaggerDocsRoute;
