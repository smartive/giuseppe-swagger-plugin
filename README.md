# giuseppe-swagger-plugin

This is a plugin for [giuseppe](http://giuseppe.smartive.ch).

##### A bunch of badges

[![Build Status](https://travis-ci.org/smartive/giuseppe-swagger-plugin.svg)](https://travis-ci.org/smartive/giuseppe-swagger-plugin)
[![npm](https://img.shields.io/npm/v/@smartive/giuseppe-swagger-plugin.svg?maxAge=3600)](https://www.npmjs.com/package/@smartive/giuseppe-swagger-plugin)
[![Coverage status](https://img.shields.io/coveralls/smartive/giuseppe-swagger-plugin.svg?maxAge=3600)](https://coveralls.io/github/smartive/giuseppe-swagger-plugin)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Greenkeeper badge](https://badges.greenkeeper.io/smartive/giuseppe-swagger-plugin.svg)](https://greenkeeper.io/)

## Installation

To install this package, simply run

[![NPM](https://nodei.co/npm/giuseppe-swagger-plugin.png?downloads=true&stars=true)](https://nodei.co/npm/giuseppe-swagger-plugin/)

## How to use

Here is a brief example of how to add the plugin to giuseppe:

```typescript
import { Giuseppe } from 'giuseppe';
import { GiuseppeSwaggerPlugin } from 'giuseppe-swagger-plugin';

const app = new Giuseppe();
app.registerPlugin(new GiuseppeSwaggerPlugin());
app.start();
```

This is how to enrich a Giuseppe controller with swagger annotations:

```typescript
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
```

This is how to enrich a model with swagger annotations:

```typescript
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
```

This is how to generate the swagger json:

```typescript
import { SwaggerDocs } from 'giuseppe-swagger-plugin';

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
```

## Changelog

The changelog is generated by [semantic release](https://github.com/semantic-release/semantic-release) and is located under the 
[release section](https://github.com/smartive/giuseppe-swagger-plugin/releases).

## Licence

This software is licenced under the [MIT](LICENSE) licence.
