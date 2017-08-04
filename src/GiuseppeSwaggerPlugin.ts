import {
    ControllerDefinitionConstructor,
    Giuseppe,
    GiuseppePlugin,
    ParameterDefinitionConstructor,
    ReturnType,
    RouteDefinitionConstructor,
    RouteModificatorConstructor,
} from 'giuseppe';

/**
 * Giuseppe plugin.
 * Swagger documentation generator
 * 
 * @export
 * @class GiuseppeSwaggerPlugin
 * @implements {GiuseppePlugin}
 */
export class GiuseppeSwaggerPlugin implements GiuseppePlugin {
    public returnTypeHandler: ReturnType<any>[] | null = null;
    public controllerDefinitions: ControllerDefinitionConstructor[] | null = null;
    public routeDefinitions: RouteDefinitionConstructor[] | null = null;
    public routeModificators: RouteModificatorConstructor[] | null = null;
    public parameterDefinitions: ParameterDefinitionConstructor[] | null = null;

    public get name(): string {
        return this.constructor.name;
    }

    public initialize(giuseppe: Giuseppe): void {
    }
}
