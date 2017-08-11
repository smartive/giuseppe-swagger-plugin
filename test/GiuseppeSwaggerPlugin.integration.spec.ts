import { SwaggerField } from '../src/decorators/SwaggerField';
import { SwaggerParam } from '../src/decorators/SwaggerParam';
import { SwaggerRoute } from '../src/decorators/SwaggerRoute';
import { SwaggerObject } from '../src/decorators/SwaggerObject';
import { GiuseppeSwaggerPlugin } from '../src/GiuseppeSwaggerPlugin';
import { SwaggerDocs } from '../src/decorators/SwaggerDocs';
import { Controller, Get, Giuseppe, Header, Query } from 'giuseppe';
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
            ): Model {
                return new Model();
            }
        }

        const response = await get({
            uri: 'http://localhost:8080/swagger',
            json: true,
        });
        expect(response).toMatchSnapshot();
    });
});
