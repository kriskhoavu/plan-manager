# Frontend Design: Search And Navigation

## Overview

PM-005 adds a global search and quick switcher experience. It also adds saved filters and recent items. The UI should stay compact and work-focused.

## Data Model

### SearchResult

| Field      | Type     | Purpose                |
|------------|----------|------------------------|
| `id`       | `string` | Result key             |
| `type`     | `string` | Result category        |
| `title`    | `string` | Main display text      |
| `subtitle` | `string` | Secondary display text |
| `context`  | `string` | Matched context        |
| `route`    | `string` | Route to navigate to   |

### SavedFilter

| Field     | Type                      | Purpose          |
|-----------|---------------------------|------------------|
| `id`      | `string`                  | Filter ID        |
| `name`    | `string`                  | Display name     |
| `route`   | `string`                  | Route to restore |
| `filters` | `Record<string, unknown>` | Stored filters   |

## State Management

| Hook               | Responsibility                                  |
|--------------------|-------------------------------------------------|
| `useGlobalSearch`  | Query state, result loading, keyboard selection |
| `useSavedFilters`  | Load, save, delete, and apply saved filters     |
| `useRecentItems`   | Track and load recently opened items            |
| `useQuickSwitcher` | Open state and keyboard actions                 |

## UI Changes

| Area          | Change                                                   |
|---------------|----------------------------------------------------------|
| App shell     | Add global search button and keyboard shortcut           |
| Search dialog | Show grouped item, workspace, branch, and filter results |
| Kanban page   | Save current filters and open saved filters              |
| Items page    | Use shared search result navigation patterns             |
| Item open     | Record recent items locally                              |

## Design Decisions

| Decision                    | Rationale                                    |
|-----------------------------|----------------------------------------------|
| Use a dialog for search     | Keeps search available from all pages        |
| Keep results keyboard-first | Frequent users should navigate without mouse |
| Keep saved filters compact  | They are shortcuts, not a dashboard          |
| Reuse current routes        | Avoid new navigation concepts                |

