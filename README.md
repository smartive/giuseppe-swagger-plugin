# giuseppe-swagger-plugin

This is a plugin for [giuseppe](http://giuseppe.smartive.ch).
Swagger documentation generator

## Installation

To install this package, simply run

`npm i giuseppe-swagger-plugin -S`

## How to use

*How to use the plugin.*
Here is a brief example of how to add the plugin to giuseppe:
```typescript
import { Giuseppe } from 'giuseppe';
import { GiuseppeSwaggerPlugin } from 'giuseppe-swagger-plugin';

const app = new Giuseppe();
app.registerPlugin(new GiuseppeSwaggerPlugin());
app.start();
```

## Changelog

The changelog is based on [keep a changelog](http://keepachangelog.com) and is located here:

[Changelog](CHANGELOG.md)
