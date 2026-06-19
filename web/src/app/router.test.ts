import { describe, expect, it } from 'vitest';
import { pathForRoute, routeFromLocation } from './router';

describe('router', () => {
  it('parses item workspace routes', () => {
    window.history.pushState(null, '', '/items/PM-003%20Architecture');

    expect(routeFromLocation()).toEqual({ name: 'workspace', itemId: 'PM-003 Architecture' });
  });

  it('builds paths for routes', () => {
    expect(pathForRoute({ name: 'kanban' })).toBe('/kanban');
    expect(pathForRoute({ name: 'items' })).toBe('/items');
    expect(pathForRoute({ name: 'branches' })).toBe('/branches');
    expect(pathForRoute({ name: 'workspaces' })).toBe('/workspaces');
    expect(pathForRoute({ name: 'workspace', itemId: 'PM-003 Architecture' })).toBe('/items/PM-003%20Architecture');
  });
});
