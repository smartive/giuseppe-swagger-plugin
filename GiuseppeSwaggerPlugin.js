"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SwaggerDocs_1 = require("./decorators/SwaggerDocs");
/**
 * Giuseppe plugin.
 * Swagger documentation generator
 *
 * @export
 * @class GiuseppeSwaggerPlugin
 * @implements {GiuseppePlugin}
 */
class GiuseppeSwaggerPlugin {
    constructor() {
        this.returnTypeHandler = null;
        this.controllerDefinitions = null;
        this.routeDefinitions = [];
        this.routeModificators = null;
        this.parameterDefinitions = null;
    }
    get name() {
        return this.constructor.name;
    }
    initialize() {
        this.routeDefinitions.push(SwaggerDocs_1.SwaggerDocsRoute);
    }
}
exports.GiuseppeSwaggerPlugin = GiuseppeSwaggerPlugin;
