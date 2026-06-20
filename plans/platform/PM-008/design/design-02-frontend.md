# Frontend Design: PM-008 Explorer Productivity

## Overview

Extend the PM-007 Explorer toolbar, tree rows, and route-backed selection. Keep the existing page and lazy tree architecture.

## Components And Hooks

| Component / Hook            | Responsibility                                             |
|-----------------------------|------------------------------------------------------------|
| `useWorkspacePathSearch`    | Debounce queries, cancel stale responses, and scope search |
| `useWorkspacePathMutations` | Create and rename, then invalidate affected cache keys     |
| `buildWorkspaceGitStateMap` | Normalize Git path state for loaded rows                   |
| `ExplorerSearchResults`     | Render bounded results and keyboard selection              |
| `ExplorerCreateDialog`      | Create Markdown files and directories                      |
| `ExplorerRenameDialog`      | Confirm a safe destination name                            |
| `ExplorerTreeRow`           | Show Git state and expose contextual actions               |

## State

| State                    | Owner                       | Persistence        |
|--------------------------|-----------------------------|--------------------|
| Search text and scope    | `useWorkspacePathSearch`    | Component lifetime |
| Search results           | `useWorkspacePathSearch`    | Request lifetime   |
| Git path map             | `useWorkspaceExplorer`      | Memory cache       |
| Create / rename dialog   | `WorkspaceExplorerPage`     | None               |
| Mutation busy and errors | `useWorkspacePathMutations` | None               |
| Expanded ancestors       | Existing Explorer state     | Local storage      |
| Result selection         | Existing route query        | Browser history    |

## Interaction Rules

- Search results open with Enter and support arrow-key navigation.
- Opening a result expands every parent path before selecting it.
- Create actions use the selected directory or selected file's parent.
- Rename uses the current base name as the initial value.
- File editor autosave must settle before rename changes selection.
- Successful mutations refresh affected parents and keep unrelated caches.
- Git markers use text alternatives and do not rely on color alone.
- Destructive delete controls are not added.

## Responsive Behavior

- Desktop shows search results below the toolbar and row actions on hover or focus.
- Tablet keeps actions in the existing compact tree pane.
- Mobile uses full-width dialogs and persistent row action buttons.
