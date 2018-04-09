import { getOrDefineMetadata } from '../utils/metadata';
import { SwaggerFieldData } from '../models/SwaggerDoc';

// tslint:disable-next-line:function-name - This is a decorator
export function SwaggerField(data: SwaggerFieldData = {}): PropertyDecorator {
    return (target: Object, name: string) => {
        const objectData = getOrDefineMetadata(target);
        objectData.fields[name] = data;
    };
}
