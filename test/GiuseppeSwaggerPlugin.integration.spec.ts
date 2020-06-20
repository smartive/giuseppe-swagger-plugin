import { Controller, Get, Giuseppe, Header, Query, UrlParam } from 'giuseppe';
import { get } from 'request-promise';
import { SwaggerDocs } from '../src/decorators/SwaggerDocs';
import { SwaggerField } from '../src/decorators/SwaggerField';
import { SwaggerObject } from '../src/decorators/SwaggerObject';
import { SwaggerParam } from '../src/decorators/SwaggerParam';
import { SwaggerRoute } from '../src/decorators/SwaggerRoute';
import { GiuseppeSwaggerPlugin } from '../src/GiuseppeSwaggerPlugin';

const PORT = 8080;

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
      public getSwagger(): void {}
    }

    controller = Ctrl;

    giusi = new Giuseppe();
    giusi.registerPlugin(new GiuseppeSwaggerPlugin());

    await giusi.start(PORT);
  });

  afterAll(async () => {
    await giusi.stop();
    (Giuseppe as any).registrar.controller = [];
  });

  it('generates swagger docs', async () => {
    @SwaggerObject({
      description: 'Another model',
    })
    class Other {
      @SwaggerField()
      public x: boolean;
    }

    class A {
      @SwaggerField()
      public x: string;
    }
    class B {
      @SwaggerField()
      public y: string;
    }

    @SwaggerObject({
      oneOf: [A, B],
    })
    class OneOf {}

    class C {
      @SwaggerField()
      public z: string;

      @SwaggerField({
        schema: {
          oneOf: ['a', 'b'],
        },
      })
      public y: string;
    }

    @SwaggerObject({
      additionalPropertiesType: C,
    })
    class AdditionalProperties {}

    @SwaggerObject({
      description: 'A model',
    })
    class Model {
      @SwaggerField({
        required: true,
      })
      public a: string;

      @SwaggerField()
      public b: number;

      @SwaggerField({
        type: Other,
      })
      public c: Model;

      @SwaggerField({
        type: Number,
      })
      public d: number[];

      @SwaggerField({
        type: Other,
      })
      public e: Other[];

      @SwaggerField({
        type: OneOf,
      })
      public oneOf: OneOf;

      @SwaggerField({
        type: AdditionalProperties,
      })
      public additionalProperties: AdditionalProperties;
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
      public getRoute(
        @Query('a')
        a: string,

        @SwaggerParam({
          default: 10,
          description: 'Parameter b',
          deprecated: true,
          minimum: 0,
          maximum: 10,
        })
        @Query('b')
        b: number,

        @SwaggerParam({
          type: Model,
        })
        @Query('c')
        c: Model,

        @SwaggerParam({
          type: Number,
        })
        @Query('d')
        d: number[],

        @SwaggerParam({
          type: Model,
        })
        @Query('e')
        e: Model[],

        @Header('f')
        f: string,

        @SwaggerParam({
          enum: ['a', 'b', 'c'],
        })
        @Query('othername')
        g: string,
      ): Model {
        return new Model();
      }

      @SwaggerRoute({
        description: 'Another route',
        responses: {},
      })
      @Get(':id')
      public getOther(
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
      uri: `http://localhost:${PORT}/swagger`,
      json: true,
    });
    expect(response).toMatchSnapshot();
  });
});
