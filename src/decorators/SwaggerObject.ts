import { getOrDefineMetadata } from '../utils/metadata';
import { SwaggerObjectData } from '../models/SwaggerDoc';

// tslint:disable-next-line:function-name - This is a decorator
export function SwaggerObject(data: SwaggerObjectData): ClassDecorator {
    return (target: any) => {
        Object.assign(getOrDefineMetadata(target.prototype), data);
    };
}
