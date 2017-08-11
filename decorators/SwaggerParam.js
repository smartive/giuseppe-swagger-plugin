"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const giuseppe_1 = require("giuseppe");
// tslint:disable-next-line:function-name - This is a decorator
function SwaggerParam(swaggerData) {
    return (target, propertyKey, parameterIndex) => {
        const meta = new giuseppe_1.ControllerMetadata(target);
        const param = meta.parameters(propertyKey).find(p => p.index === parameterIndex);
        if (!param) {
            throw new Error('SwaggerParam must also be a Giuseppe param');
        }
        param.swagger = swaggerData;
    };
}
exports.SwaggerParam = SwaggerParam;
