# Frontend Design: PM-011

## Route Model

| URL           | Result               |
|---------------|----------------------|
| `/kanban`     | Kanban               |
| `/explorer`   | Workspace Explorer   |
| `/workspaces` | Workspace management |
| `/items/{id}` | Item workspace       |
| `/items`      | Kanban fallback      |
| `/branches`   | Kanban fallback      |

## Source Changes

- Remove `ItemsPage` and `BranchesPage` imports and rendering.
- Remove desktop and mobile navigation buttons.
- Remove top-level route variants and path generation.
- Delete the two page components and obsolete page tests.
- Preserve item-detail parsing before the legacy `/items` fallback.

## Verification

- Router tests cover retained item details and removed top-level URLs.
- App tests cover the simplified top-level route set.
- Typecheck catches stale route or page references.
- Full frontend tests and production build must pass.
