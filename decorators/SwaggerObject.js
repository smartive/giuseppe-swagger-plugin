"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const metadata_1 = require("../utils/metadata");
// tslint:disable-next-line:function-name - This is a decorator
function SwaggerObject(data) {
    return (target) => {
        Object.assign(metadata_1.getOrDefineMetadata(target.prototype), data);
    };
}
exports.SwaggerObject = SwaggerObject;
