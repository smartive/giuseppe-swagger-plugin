import { ControllerMetadata } from 'giuseppe';
import { FunctionMethodDecorator } from 'giuseppe/core/routes/GiuseppeBaseRoute';
import { SwaggerRouteData } from '../models/SwaggerDoc';

// tslint:disable-next-line:function-name - This is a decorator
export function SwaggerRoute(swaggerData: SwaggerRouteData): FunctionMethodDecorator {
  return (target: Object, _: string | symbol, descriptor: TypedPropertyDescriptor<Function>) => {
    const meta = new ControllerMetadata(target);
    const route = meta.routes().find(r => r.routeFunction === descriptor.value);
    if (!route) {
      throw new Error('SwaggerRoute must also be a Giuseppe route');
    }
    (route as any).swagger = swaggerData;
  };
}
