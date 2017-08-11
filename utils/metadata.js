"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SWAGGER_DATA_KEY = 'swagger';
function getOrDefineMetadata(target) {
    if (!Reflect.hasMetadata(exports.SWAGGER_DATA_KEY, target)) {
        Reflect.defineMetadata(exports.SWAGGER_DATA_KEY, {
            fields: {},
        }, target);
    }
    return getMetadata(target);
}
exports.getOrDefineMetadata = getOrDefineMetadata;
function getMetadata(target) {
    return Reflect.getMetadata(exports.SWAGGER_DATA_KEY, target);
}
exports.getMetadata = getMetadata;
