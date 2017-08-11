"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const metadata_1 = require("../utils/metadata");
// tslint:disable-next-line:function-name - This is a decorator
function SwaggerField(data = {}) {
    return (target, name) => {
        const objectData = metadata_1.getOrDefineMetadata(target);
        if (!objectData.fields) {
            objectData.fields = {};
        }
        objectData.fields[name] = data;
    };
}
exports.SwaggerField = SwaggerField;
