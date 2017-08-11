import { FunctionMethodDecorator, GiuseppeBaseRoute } from 'giuseppe/core/routes/GiuseppeBaseRoute';
export interface SwaggerDocsOptions {
    info: {
        title: string;
        version: string;
        description: string;
    };
}
export declare function SwaggerDocs(route: string, options: SwaggerDocsOptions): FunctionMethodDecorator;
export declare class SwaggerDocsRoute extends GiuseppeBaseRoute {
    private options;
    private swagger;
    constructor(route: string | undefined, options: SwaggerDocsOptions);
    private getSwagger();
    private buildSwagger();
    private buildHandler(definitions, data, parameterDefinitions);
    private buildResponses(definitions, responseDefinitions);
    private registerType(definitions, type);
    private buildField(name, type, objectType);
    private buildTypeSchema(baseType, type);
    private buildParameters(definitions, parameterDefinitions);
    private buildParameter(definitions, parameter);
}
