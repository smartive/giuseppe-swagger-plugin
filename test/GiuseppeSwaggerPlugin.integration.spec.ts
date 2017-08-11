import { SwaggerField } from '../src/decorators/SwaggerField';
import { SwaggerParam } from '../src/decorators/SwaggerParam';
import { SwaggerRoute } from '../src/decorators/SwaggerRoute';
import { SwaggerObject } from '../src/decorators/SwaggerObject';
import { GiuseppeSwaggerPlugin } from '../src/GiuseppeSwaggerPlugin';
import { SwaggerDocs } from '../src/decorators/SwaggerDocs';
import { Controller, Get, Giuseppe, Header, Query, UrlParam } from 'giuseppe';
import { get } from 'request-promise';

describe('GiuseppeSwaggerPlugin <integration test>', () => {
    let giusi: Giuseppe;
    let controller: Function;

    beforeAll(async () => {
        @Controller()
        class Ctrl {
            @SwaggerDocs('swagger', {
                info: {
                    description: 'A test swagger route.',
                    title: 'Swagger',
                    version: '1.0.0',
                },
            })
            public getSwagger(): void { }
        }

        controller = Ctrl;

        giusi = new Giuseppe();
        giusi.registerPlugin(new GiuseppeSwaggerPlugin());

        await giusi.start();
    });

    afterAll(() => {
        giusi.stop();
        (Giuseppe as any).registrar.controller = [];
    });

    it('generates swagger docs', async () => {
        @SwaggerObject({
            description: 'Another model',
        })
        class Other {
            @SwaggerField()
            x: boolean;
        }

        class A {
            @SwaggerField()
            x: string;
        }
        class B {
            @SwaggerField()
            y: string;
        }

        @SwaggerObject({
            oneOf: [A, B],
        })
        class OneOf {}


        class C {
            @SwaggerField()
            z: string;

            @SwaggerField({
                schema: {
                    oneOf: ['a', 'b']
                }
            })
            y: string;
        }

        @SwaggerObject({
            additionalPropertiesType: C,
        })
        class AdditionalProperties { }

        @SwaggerObject({
            description: 'A model',
        })
        class Model {
            @SwaggerField({
                required: true,
            })
            a: string;

            @SwaggerField()
            b: number;

            @SwaggerField({
                type: Other,
            })
            c: Model;

            @SwaggerField({
                type: Number
            })
            d: number[];

            @SwaggerField({
                type: Other
            })
            e: Other[];

            @SwaggerField({
                type: OneOf
            })
            oneOf: OneOf;

            @SwaggerField({
                type: AdditionalProperties
            })
            additionalProperties: AdditionalProperties
        }

        @Controller()
        class Ctrl2 {
            @SwaggerRoute({
                description: 'A route',
                responses: {
                    200: {
                        description: 'Response description',
                        type: Model,
                    },
                },
            })
            @Get('route')
            getRoute(
                @Query('a')
                a: string,

                @SwaggerParam({
                    default: 10,
                    description: 'Parameter b',
                    deprecated: true,
                    minimum: 0,
                    maximum: 10
                })
                @Query('b')
                b: number,

                @SwaggerParam({
                    type: Model
                })
                @Query('c')
                c: Model,

                @SwaggerParam({
                    type: Number
                })
                @Query('d')
                d: number[],

                @SwaggerParam({
                    type: Model
                })
                @Query('e')
                e: Model[],

                @Header('f')
                f: string,

                @SwaggerParam({
                    enum: ['a', 'b', 'c'],
                })
                @Query('othername')
                g: string
            ): Model {
                return new Model();
            }

            @SwaggerRoute({
                description: 'Another route',
                responses: {},
            })
            @Get(':id')
            getOther(
                @SwaggerParam({
                    description: 'id',
                })
                @UrlParam('id')
                id: string,
            ): number {
                return 1;
            }
        }

        const response = await get({
            uri: 'http://localhost:8080/swagger',
            json: true,
        });
        expect(response).toMatchSnapshot();
    });
});
