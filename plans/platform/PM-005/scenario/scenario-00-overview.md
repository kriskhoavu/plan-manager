# Scenario 0: Find And Open Work Quickly

## Goal

Help the user find items, workspaces, branches, and saved views quickly.

## Starting State

| #   | State      | Summary                                                 |
|-----|------------|---------------------------------------------------------|
| 1   | Workspaces | User has indexed one or more local Git workspaces       |
| 2   | Items      | Item summaries are stored in `item-index.yaml`          |
| 3   | Pages      | User can browse Kanban, item list, branches, and detail |
| 4   | Filters    | Kanban has page-local filters                           |

## Execution Flows

### Flow 0.1: Global Search

```text
User opens search
  -> types query
  -> frontend calls /api/search
  -> backend searches indexed items
  -> backend ranks results
  -> frontend shows grouped results
  -> user opens selected item
```

### Flow 0.2: Save A Filter

```text
User filters Kanban
  -> clicks save filter
  -> frontend sends filter definition
  -> backend stores saved filter locally
  -> user opens saved filter later
  -> app restores route and filters
```

### Flow 0.3: Quick Switcher

```text
User presses keyboard shortcut
  -> quick switcher opens
  -> user searches item, workspace, branch, or route
  -> user presses Enter
  -> app navigates to the target
```

## Invariants

| Invariant        | Requirement                                           |
|------------------|-------------------------------------------------------|
| Read-only search | Search does not write to workspaces                   |
| Local storage    | Saved filters and recents stay in app config          |
| Fast response    | Search uses cached index and avoids scanning on query |
| Stable routes    | Current app routes keep working                       |

