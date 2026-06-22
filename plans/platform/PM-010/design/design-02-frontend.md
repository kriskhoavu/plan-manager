# Frontend Design: PM-010

## Workspace Root UI

Each workspace root keeps its existing folder action. A compact branch selector appears on the same row and shows the current branch.

## State

| State           | Scope        | Purpose                                      |
|-----------------|--------------|----------------------------------------------|
| Branch response | Workspace ID | Current and local branch names               |
| Switching state | Workspace ID | Disable only the active workspace selector   |
| Branch error    | Workspace ID | Show a local error without breaking the tree |
| Explorer cache  | Workspace ID | Remove only data from the switched workspace |

## Interaction

1. Load branch data for visible workspace roots.
2. Stop selector clicks from selecting or expanding the root.
3. If the editor is dirty, save it before requesting checkout.
4. Request branch switch with `confirm: false`.
5. Clear the switched workspace file selection and branch-stale caches.
6. Reload expanded paths, Git states, and branch data.
7. Clear unified search results because their files may have changed.

## Accessibility

- Label each selector with the workspace name.
- Keep native keyboard selection behavior.
- Expose loading and error text near the affected root.
- Preserve tree keyboard navigation outside the selector.

## Verification

- API tests cover branch response normalization.
- Hook tests cover workspace-scoped invalidation.
- Explorer tests cover independent branch controls, successful switching, and dirty failures.
- Typecheck, full frontend tests, and production build must pass.
