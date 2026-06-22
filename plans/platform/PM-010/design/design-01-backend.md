# Backend Design: PM-010

## API Endpoint

| Method | Endpoint                            | Request  | Response            |
|--------|-------------------------------------|----------|---------------------|
| GET    | `/api/workspaces/{id}/git/branches` | None     | `WorkspaceBranches` |
| POST   | `/api/workspaces/{id}/git/switch`   | `{name}` | Existing Git result |

## Response Model

```json
{
  "workspaceId": "workspace-id",
  "current": "main",
  "branches": ["feature/a", "main"]
}
```

## Rules

- Resolve the workspace through the registry.
- Read the current branch and local branch refs from the same workspace path.
- Sort branches naturally and remove duplicates.
- Include the current branch if Git did not return it in the local list.
- Keep the existing branch-name validation and checkout implementation.
- Reject dirty or conflicted workspaces without using `confirm` from Explorer.
- Refresh indexed items after a successful checkout.

## Error Handling

| Condition                  | Result                                 |
|----------------------------|----------------------------------------|
| Unknown workspace          | Existing workspace-not-found response  |
| Git branch listing failure | API error with the Git failure message |
| Dirty working tree         | Existing guarded switch error and hint |
| Missing branch             | Existing Git switch failure            |

## Verification

- Service tests cover sorted branch responses and workspace resolution.
- API tests cover the list route and existing switch route compatibility.
- Full Go tests protect existing Git operations.
