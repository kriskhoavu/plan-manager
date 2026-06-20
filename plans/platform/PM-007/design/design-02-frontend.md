# Frontend Design: PM-007 Workspace Explorer

## Overview

The frontend adds a global `/explorer` route beside Kanban. Every registered workspace is a top-level root. The page uses three panes: a real directory tree, a file workspace with Preview, Raw, and Diff, and a context inspector. Markdown editing reuses a shared editor session extracted from item details.

## Route

```text
/explorer
/explorer?workspaceId={workspaceId}&path={encodedRelativePath}
```

The route query identifies selection, not snapshot scope. Explorer always shows all workspaces. Opening Kanban from a workspace row explicitly sets that workspace active and navigates to `/kanban`.

## Layout

```text
┌────────────────────────┬────────────────────────────────────┬──────────────────────┐
│ Workspaces             │ File Workspace                     │ Inspector            │
│                        │                                    │                      │
│ Search + filters       │ Breadcrumb + file actions          │ File / Item / Git    │
│ Repository directories │ Preview / Raw / Diff               │ Status and warnings  │
│ Enriched item folders  │ PM-006 viewer or Markdown editor   │ Health and metadata  │
└────────────────────────┴────────────────────────────────────┴──────────────────────┘
```

Desktop uses resizable panes. Tablet can collapse the inspector. Mobile switches between tree and file workspace, with the inspector as a side sheet.

## Types

```typescript
type ExplorerNodeKind = 'workspace' | 'directory' | 'file';

interface ExplorerSelection {
  nodeId: string;
  kind: ExplorerNodeKind;
  workspaceId: string;
  path: string;
}

interface DirectoryCacheEntry {
  state: 'idle' | 'loading' | 'loaded' | 'error';
  entries: WorkspaceTreeEntry[];
  hiddenCount: number;
  error?: string;
}

interface VisibleExplorerRow {
  node: WorkspaceTreeEntry | WorkspaceRootNode;
  level: number;
  parentId?: string;
  positionInSet: number;
  setSize: number;
  item?: ExplorerItemDecoration;
}
```

## Existing Data Reuse

- `workspaces` from app state provide top-level roots.
- `api.items` without a workspace filter provides indexed item paths for decoration.
- `ContentViewer` renders file preview.
- `parseGitDiff` renders review diff.
- Workspace health and Git status remain lazy inspector requests.
- Current item workspace autosave behavior becomes a shared `useFileEditorSession` hook.

## State Ownership

| State                           | Owner                  | Persistence                       |
|---------------------------------|------------------------|-----------------------------------|
| Registered workspace roots      | App state              | Existing app lifecycle            |
| Indexed item decorations        | Explorer hook          | Request lifetime                  |
| Directory listing cache         | Explorer hook          | Memory until refresh              |
| Selected workspace and path     | Route query            | Deep link                         |
| Expanded directory IDs          | Explorer hook          | Local storage                     |
| Search and workspace filters    | Explorer toolbar       | Session only                      |
| Show ignored files              | Explorer hook          | Local storage                     |
| Editor content and autosave     | `useFileEditorSession` | Memory until save settles         |
| File content and diff           | File workspace hook    | Memory by workspace and path      |
| Item, Git, and health details   | Inspector hook         | Lazy memory cache                 |
| Pane widths and inspector state | Layout hook            | Local storage with bounded values |
| Keyboard active row             | Keyboard hook          | Component lifetime                |

## Directory Loading

1. Workspace rows start collapsed or restore saved expansion.
2. Expanding a row requests only its immediate children.
3. The row shows a fixed-height local loading child.
4. Results cache by workspace, directory path, and ignored-file preference.
5. Collapse does not discard loaded children.
6. Refresh clears caches and reloads only currently expanded directories.
7. Failed directories show a retry child without collapsing unrelated rows.

## Item Decorations

Build a map keyed by `workspaceId + normalized itemPath`. When a real directory path matches an indexed item:

- Show identifier and title below the directory name.
- Add a small status rail or dot.
- Show branch, owner, warning count, and item file count when present.
- Add an Open item details action.
- Keep the directory expandable as a normal filesystem path.

The filesystem node remains the source of truth. Decorations never create duplicate virtual item rows.

## Shared Editor Session

Extract current item detail behavior into `features/file-editor`:

```text
features/file-editor/
├── useFileEditorSession.ts
├── FileModeTabs.tsx
├── FileEditState.tsx
├── types.ts
└── tests
```

The hook accepts load, save, diff, and revert adapters. Item details and Explorer provide different API adapters but share:

- `preview`, `raw`, and `diff` modes.
- Editor and saved content state.
- Dirty detection.
- 900 ms autosave timing.
- `idle`, `pending`, `saving`, `saved`, and `error` states.
- Expected hash handling.
- Stale-content recovery hints.
- Immediate save before selection or navigation.
- Diff refresh after saves.
- Revert confirmation and state reset.

Only editable Markdown enables the Raw textarea. Other formats can use the PM-006 Source mode but cannot save.

## File Selection

1. Save pending Markdown before changing selection.
2. Update route query with workspace and path.
3. Request workspace file content.
4. Load selected-file diff lazily.
5. Default to Preview.
6. Render PM-006 in Preview.
7. Render textarea only for editable Markdown in Raw.
8. Render parsed or raw Git diff in Diff.

If save fails, keep the current file selected and show the recovery hint.

## Keyboard Model

| Key          | Behavior                              |
|--------------|---------------------------------------|
| `ArrowDown`  | Move to next visible row              |
| `ArrowUp`    | Move to previous visible row          |
| `ArrowRight` | Expand row, then move to first child  |
| `ArrowLeft`  | Collapse row, then move to parent     |
| `Enter`      | Select directory or open file         |
| `Space`      | Expand or collapse an expandable row  |
| `Home`       | Move to first visible row             |
| `End`        | Move to last visible row              |
| `Cmd/Ctrl+K` | Keep existing quick switcher behavior |

Rows use roving `tabIndex` and expose tree accessibility metadata.

## Tree Projection

`flattenVisibleNodes` combines workspace roots, directory caches, expansion state, item decorations, and filters.

Rules:

- Include ancestors of path and item matches.
- Search loaded names, paths, and item metadata.
- Do not recursively load directories for search.
- Keep stored expansion unchanged while filtering.
- Use namespaced IDs based on workspace and path.
- Include synthetic loading, error, and truncated children.
- Memoize by roots, cache version, expansion, ignored mode, and filters.

## Toolbar

- Search loaded names, paths, and item metadata.
- Workspace filter menu.
- Show ignored files toggle.
- Collapse-all icon button.
- Refresh icon button.
- Visible row and workspace counts.

Do not add explanatory feature text to the interface.

## File Workspace

- Breadcrumbs show workspace and every directory segment.
- Preview, Raw, and Diff tabs match item details.
- Autosave state appears in the same location and vocabulary.
- PM-006 handles preview and source controls.
- Revert uses a confirmation dialog.
- Reveal path uses the existing system path action.
- An item-decorated path can open full item details.
- Empty selection shows workspace summary or recent files, not a marketing panel.

## Inspector

| Selection | Default Content                                                      |
|-----------|----------------------------------------------------------------------|
| Workspace | Root path, baseline branch, sources, counts, health, and Open Kanban |
| Directory | Relative path, item decoration, child state, and reveal action       |
| File      | Kind, size, editability, Git state, hash summary, and item context   |

Git status is read-only in Explorer. Commit, fetch, pull, push, and branch actions remain in item details or existing workspace flows.

## Virtualization

Evaluate `@tanstack/react-virtual` during F2. Accept it only if React 19 compatibility, accessibility, tests, and measured tree size justify it. Keep the flattened row contract independent of the decision.

## Styling

- Use one feature-owned stylesheet.
- Reuse current tree rows, pane resize behavior, tabs, autosave labels, diff styles, and status tokens.
- Keep workspace roots visually strong but not card-like.
- Keep ordinary directories quiet.
- Give decorated item directories a compact metadata line and status rail.
- Use stable row heights for each node type.
- Keep action columns fixed so hover controls do not shift labels.
- Prevent long paths and filenames from overlapping controls.
- Use responsive pane constraints and mobile internal navigation.

## Accessibility

- Follow the WAI-ARIA tree keyboard pattern.
- Announce directory loading, hidden ignored counts, autosave, and failures.
- Keep row actions reachable without breaking tree navigation.
- Provide tooltips and names for icon-only actions.
- Preserve focus when lazy children arrive.
- Do not rely on color alone for item status or Git changes.

## Test Strategy

- Pure tests for flattening, path IDs, decoration matching, filtering, and ancestors.
- Hook tests for lazy loading, cache keys, ignored toggle, refresh, and persistence.
- Shared editor tests for debounce, stale hash, immediate save, diff refresh, and revert.
- Regression tests proving item details still use unchanged editor behavior.
- Keyboard tests for expansion, selection, and focus retention.
- Integration tests for Preview, Raw, Diff, PM-006, and route selection.
- Browser checks for large trees and desktop, tablet, mobile, light, and dark layouts.

## Design Decisions

| Decision                                 | Rationale                                                                 |
|------------------------------------------|---------------------------------------------------------------------------|
| Keep Explorer global                     | Users need one tree across all registered repositories                    |
| Use real directory nodes                 | The requested hierarchy is the workspace filesystem                       |
| Share editor behavior                    | Explorer and details must have identical save and conflict handling       |
| Keep Markdown-only editing               | Match current detail behavior and backend validation                      |
| Decorate item directories                | Add planning context without replacing filesystem truth                   |
| Store selection in the URL               | Deep links and browser navigation remain predictable                      |
| Keep mutation-heavy Git controls outside | Explorer remains focused on files and avoids duplicate Git workflow state |
