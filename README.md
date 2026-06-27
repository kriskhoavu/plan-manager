# Plan Manager

Plan Manager is a local Git-native web app for browsing and editing item documents across workspaces.

It helps developers and technical leads turn folder-based item docs into item cards with a Kanban board, workspace management, file explorer, Markdown editor, metadata editor, Git diff, and guarded Git operations.

## Business Point Of View

Engineering plans and configured docs often live in Git as Markdown files. That is good for review, history, and ownership, but it is hard to see progress across many branches, sources, and workspaces.

Plan Manager gives those files a product-management view without moving them out of Git.

It solves these problems:

- Teams can browse items without manually walking folders and branches.
- A workspace can expose multiple sources, such as `plans`, `docs`, or `specs`.
- Structured items, configured docs, and freestyle docs can appear in the same workspace.
- Developers can inspect and update planning context, implementation phases, files, metadata, status, and local diffs in one place.
- The app stores its own registry and cache outside managed workspaces, so scanning does not dirty target workspaces.

## Vision

The long-term vision is a local authoring workspace for Git-based planning.

Current capabilities:

- Register workspaces from a local Git path or a remote Git URL (HTTPS/SSH clone to local).
- Configure one or more sources.
- Scan structured item roots, configured document roots, and freestyle docs roots.
- Configure `workspace-settings.yaml` for a source so arbitrary docs layouts can be split into item cards.
- Keep plain unstructured docs in a dedicated `Unsorted` Kanban lane until source settings are added.
- View one active workspace at a time.
- Browse a Kanban board by status.
- Filter by source, status, author, branch, and text.
- Browse files across all registered workspaces in Explorer.
- Switch each Explorer workspace to a local Git branch independently.
- Open a preview drawer from a board card.
- Open an item workspace with file tree, Markdown preview, Markdown editor, item info, and diff.
- Edit Markdown files with autosave.
- Edit structured item metadata.
- Move item status from the board or metadata form.
- Create new structured items.
- Commit selected item paths.
- Fetch, pull, push, create branches, and switch branches with guarded flows.
- Edit and delete workspace registrations.
- Reveal local paths in Finder, Windows Explorer, or the Linux file manager.
- Show a stale-content popup when app state changes in another tab.
- Inspect workspace health and recent local operation activity.
- Search indexed items across one or all workspaces with keyboard navigation.
- Save and restore Kanban filter views.
- Reopen recently viewed items from global search.
- Preview Markdown, KaTeX, HTML, JSON, YAML, source code, and plain text through one secure viewer.

See [plans/platform/PM-002/README.md](plans/platform/PM-002/README.md).

## Technical Stack

| Area         | Technology                              | Purpose                                      |
|--------------|-----------------------------------------|----------------------------------------------|
| Backend      | Go 1.22                                 | Local HTTP API, filesystem access, Git calls |
| Frontend     | React 19                                | App shell, Kanban, Explorer, item workspaces |
| Build        | Vite 6                                  | Frontend build and dev server                |
| Language     | TypeScript 5                            | Frontend type safety                         |
| Tests        | Vitest, React Testing Library, Go test  | Unit and UI behavior checks                  |
| Content      | Unified, KaTeX, highlight.js, YAML      | Safe rich file previews                      |
| Icons        | lucide-react                            | UI icons                                     |
| Storage      | YAML files in user config directory     | Registry and item index cache                |
| Distribution | Go binary with embedded frontend assets | Local app runtime                            |

## Project Layout

```text
cmd/plan-manager/          Go CLI entrypoint
internal/app/              HTTP server and embedded frontend setup
internal/api/              HTTP handlers
internal/config/           User config path resolution
internal/fileaccess/       Safe item file tree, file reads, and Markdown writes
internal/gitadapter/       Git status and guarded Git commands
internal/models/           Shared backend models
internal/itemindex/        YAML-backed item summary cache
internal/itemwriter/       Safe Markdown, metadata, status, and new-item writes
internal/audit/            Append-only local operation event storage
internal/navigation/       Saved filter and recent item storage
internal/application/health/  Workspace health checks
internal/application/search/  Ranked item index search
internal/registry/         YAML-backed workspace registry
internal/scanner/          Item and docs scanner
internal/systemdialog/     Native folder picker and path reveal
web/src/                   React app source
web/src/features/content-viewer/  Shared rich content rendering and controls
internal/app/frontend/     Embedded production frontend assets
plans/                     Product and implementation plans
specs/                     Product requirements and design references
docs/                      Supporting docs
```

## Requirements

- Go 1.22 or newer.
- Node.js 20 or newer.
- npm.
- Git.

Native path selection also uses platform tools:

- macOS: `osascript` and `open`.
- Windows: PowerShell and Explorer.
- Linux: `zenity` or `kdialog` for folder selection, and `xdg-open` for path reveal.

## Run The Application

Install dependencies:

```bash
npm install
```

Build the frontend:

```bash
npm run build
```

Build the local binary:

```bash
go build -o ./bin/plan-manager ./cmd/plan-manager
```

Run the app:

```bash
./bin/plan-manager serve -port 4317
```

Open:

```text
http://127.0.0.1:4317
```

The default port is `4317`. You can also set `PLAN_MANAGER_PORT`:

```bash
PLAN_MANAGER_PORT=4317 ./bin/plan-manager serve
```

## Development Commands

Run frontend typecheck:

```bash
npm run typecheck
```

Run frontend tests:

```bash
npm test -- --run
```

Run backend tests:

```bash
go test ./...
```

Build production frontend assets:

```bash
npm run build
```

Build the app binary:

```bash
go build -o ./bin/plan-manager ./cmd/plan-manager
```

## Data Directory, Bootstrap, and Settings Files

Plan Manager stores app-owned state in one logical data directory under the current user.

Default per OS (resolved with `os.UserConfigDir()`):

- macOS: `~/Library/Application Support/plan-manager/`
- Linux: usually `~/.config/plan-manager/`
- Windows: usually `%AppData%\plan-manager\`

### Effective Data Directory Resolution

At startup, Plan Manager resolves the active data directory in this order:

1. `PLAN_MANAGER_DATA_DIR` environment variable (highest priority)
2. `bootstrap.yaml` override in the default OS data directory
3. default OS data directory

When changed from the Workspaces page, the override is stored in:

```text
<default-os-data-dir>/bootstrap.yaml
```

Example content:

```yaml
dataDir: /Users/me/.plan-manager-data
```

Changing `dataDir` requires restarting Plan Manager to fully switch runtime services.

### Data Directory Structure

```text
<effective-data-dir>/
  bootstrap.yaml        # optional override file (usually in default OS data dir)
  workspaces.yaml       # registered workspaces
  item-index.yaml       # indexed item summary cache
  audit-log.jsonl       # append-only operation audit events
  saved-filters.yaml    # saved Kanban filter views
  recent-items.yaml     # recent item navigation history
  clone-root/           # default root for remote-cloned repositories
```

### Purpose of Each Settings File

| File                       | Scope                     | Location                                                                                                  | Purpose                                                                          |
|----------------------------|---------------------------|-----------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------|
| `bootstrap.yaml`           | App bootstrap             | `<default-os-data-dir>/bootstrap.yaml`                                                                    | Stores app-level `dataDir` override used before main stores are opened           |
| `workspaces.yaml`          | App runtime               | `<effective-data-dir>/workspaces.yaml`                                                                    | Workspace registry (name, path, baseline branch, sources, mode metadata)         |
| `item-index.yaml`          | App runtime               | `<effective-data-dir>/item-index.yaml`                                                                    | Cached scan/index state for fast Kanban and search loading                       |
| `saved-filters.yaml`       | App runtime               | `<effective-data-dir>/saved-filters.yaml`                                                                 | User-saved filter presets                                                        |
| `recent-items.yaml`        | App runtime               | `<effective-data-dir>/recent-items.yaml`                                                                  | User recent item links                                                           |
| `audit-log.jsonl`          | App runtime               | `<effective-data-dir>/audit-log.jsonl`                                                                    | Local operation history (`success`/`blocked`/`failed`)                           |
| `workspace-settings.yaml`  | Workspace source          | `<workspace-path>/<source>/workspace-settings.yaml`                                                       | Optional source-structure rules for mapping arbitrary docs layout to cards       |
| `repository-settings.yaml` | Workspace source (legacy) | `<workspace-path>/<source>/repository-settings.yaml`                                                      | Legacy alias of `workspace-settings.yaml` still read for compatibility           |
| `plan.yaml`                | Plan/item directory       | `<workspace-path>/<source>/<scope>/<identifier>/plan.yaml` (or equivalent item directory for that source) | Plan metadata (`status`, optional owner/tags/title, optional document overrides) |

### `plan.yaml` Structure

Minimal typical form:

```yaml
plan:
  status: draft
```

Common extended form:

```yaml
plan:
  status: review
  owner: platform-team
  tags: [ backend, api ]
  title: API Contract Cleanup
documents:
  - path: design/design-01-backend.md
    role: design
    track: backend
    label: Backend Design
```

Notes:

- Identity (`scope`, `identifier`) is normally inferred from folder path.
- Title is usually inferred from `README.md` heading.
- Document metadata is inferred from conventional paths unless overridden.

### `workspace-settings.yaml` Structure (custom docs mapping)

```yaml
version: 1
cards:
  - pathPattern: "{folder}/feature/{item}"
    fields:
      source: docs
      item: "{item}"
      title: readme_heading
      status: draft
      tags: [docs]
```

If `workspace-settings.yaml` is missing or invalid, scanner behavior falls back to freestyle docs handling.

Registered workspaces are not used for app registry or cache storage. Plan Manager writes to workspaces only when the
user edits Markdown, changes metadata or status, creates an item, saves source settings, commits, pulls, pushes, or runs
a branch operation.

## Current Safety Model

- The app binds to `127.0.0.1`.
- Markdown edits autosave after a short debounce.
- Registry and cache writes go to the app config directory.
- File reads and writes are restricted to configured sources.
- Markdown writes use expected content hashes to detect stale edits.
- Metadata writes are limited to structured items and configured source cards. A configured source card without `plan.yaml` gets one when metadata is saved.
- Commit operations stage only selected paths inside configured sources.
- Pull and branch switch block dirty working trees unless the request confirms the risk.
- No credentials are stored.

See [ARCHITECTURE.md](ARCHITECTURE.md) for system design details.
