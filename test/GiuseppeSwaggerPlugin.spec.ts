import { Giuseppe } from 'giuseppe';

import { GiuseppeSwaggerPlugin } from '../src';

describe('GiuseppeSwaggerPlugin', () => {
  it('should return the constructor name', () => {
    const plugin = new GiuseppeSwaggerPlugin();

    expect(plugin.name).toBe('GiuseppeSwaggerPlugin');
  });

  it('should register itself in giuseppe', () => {
    const plugin = new GiuseppeSwaggerPlugin();
    const giuseppe = new Giuseppe();

    giuseppe.registerPlugin(plugin);

    expect((giuseppe as any).plugins.some(p => p.name === 'GiuseppeSwaggerPlugin')).toBeTruthy();
  });
});
