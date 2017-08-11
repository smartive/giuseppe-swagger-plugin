import { SwaggerParameterData } from '../models/SwaggerDoc';
import { ControllerMetadata } from 'giuseppe';

// tslint:disable-next-line:function-name - This is a decorator
export function SwaggerParam(swaggerData: SwaggerParameterData): ParameterDecorator {
    return (target: Object, propertyKey: string, parameterIndex: number) => {
        const meta = new ControllerMetadata(target);
        const param = meta.parameters(propertyKey).find(p => p.index === parameterIndex);
        if (!param) {
            throw new Error(`SwaggerParam ${propertyKey}:${parameterIndex} must also be a Giuseppe param`);
        }
        (param as any).swagger = swaggerData;
    };
}
