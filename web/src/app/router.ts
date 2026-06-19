export type Route = { name: 'kanban' } | { name: 'items' } | { name: 'branches' } | { name: 'workspaces' } | { name: 'workspace'; itemId: string };

export function routeFromLocation(): Route {
  const path = window.location.pathname;
  if (path.startsWith('/items/')) {
    return { name: 'workspace', itemId: decodeURIComponent(path.split('/')[2] ?? '') };
  }
  if (path === '/items') {
    return { name: 'items' };
  }
  if (path.startsWith('/branches')) {
    return { name: 'branches' };
  }
  if (path.startsWith('/workspaces')) {
    return { name: 'workspaces' };
  }
  return { name: 'kanban' };
}

export function pathForRoute(route: Route): string {
  return route.name === 'workspace'
    ? `/items/${encodeURIComponent(route.itemId)}`
    : route.name === 'workspaces'
      ? '/workspaces'
      : route.name === 'items'
        ? '/items'
        : route.name === 'branches'
          ? '/branches'
          : '/kanban';
}
