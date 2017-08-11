"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const giuseppe_1 = require("giuseppe");
// tslint:disable-next-line:function-name - This is a decorator
function SwaggerRoute(swaggerData) {
    return (target, _, descriptor) => {
        const meta = new giuseppe_1.ControllerMetadata(target);
        const route = meta.routes().find(r => r.routeFunction === descriptor.value);
        if (!route) {
            throw new Error('SwaggerRoute must also be a Giuseppe route');
        }
        route.swagger = swaggerData;
    };
}
exports.SwaggerRoute = SwaggerRoute;
