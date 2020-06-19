import { SwaggerObjectData } from '../models/SwaggerDoc';

export const SWAGGER_DATA_KEY = 'swagger';

export function getOrDefineMetadata(target: any): SwaggerObjectData {
  if (!Reflect.hasMetadata(SWAGGER_DATA_KEY, target)) {
    Reflect.defineMetadata(
      SWAGGER_DATA_KEY,
      {
        fields: {},
      },
      target,
    );
  }
  return getMetadata(target);
}

export function getMetadata(target: any): SwaggerObjectData {
  return Reflect.getMetadata(SWAGGER_DATA_KEY, target);
}
