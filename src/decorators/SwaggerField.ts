import { SwaggerFieldData } from '../models/SwaggerDoc';
import { getOrDefineMetadata } from '../utils/metadata';

// tslint:disable-next-line:function-name - This is a decorator
export function SwaggerField(data: SwaggerFieldData = {}): PropertyDecorator {
  return (target: Object, name: string) => {
    const objectData = getOrDefineMetadata(target);
    if (!objectData.fields) {
      objectData.fields = {};
    }
    objectData.fields[name] = data;
  };
}
