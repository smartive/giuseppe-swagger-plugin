import { ControllerDefinitionConstructor, GiuseppePlugin, ParameterDefinitionConstructor, ReturnType, RouteDefinitionConstructor, RouteModificatorConstructor } from 'giuseppe';
/**
 * Giuseppe plugin.
 * Swagger documentation generator
 *
 * @export
 * @class GiuseppeSwaggerPlugin
 * @implements {GiuseppePlugin}
 */
export declare class GiuseppeSwaggerPlugin implements GiuseppePlugin {
    returnTypeHandler: ReturnType<any>[] | null;
    controllerDefinitions: ControllerDefinitionConstructor[] | null;
    routeDefinitions: RouteDefinitionConstructor[];
    routeModificators: RouteModificatorConstructor[] | null;
    parameterDefinitions: ParameterDefinitionConstructor[] | null;
    readonly name: string;
    initialize(): void;
}
