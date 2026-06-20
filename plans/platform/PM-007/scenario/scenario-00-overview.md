# Scenarios: PM-007 Workspace Explorer

## Scenario List

| #   | Title                            | Description                                                  |
|-----|----------------------------------|--------------------------------------------------------------|
| 0   | Open global workspace tree       | Show all registered repositories as roots                    |
| 1   | Browse real directories          | Expand one directory level at a time                         |
| 2   | Preview supported file           | Render content through PM-006                                |
| 3   | Edit Markdown                    | Use Preview, Raw, Diff, autosave, and stale-hash protection  |
| 4   | Revert selected file             | Confirm and revert one guarded workspace path                |
| 5   | Navigate decorated item folder   | Show planning metadata on a real directory                   |
| 6   | Search and keyboard navigation   | Filter loaded paths and navigate without a pointer           |
| 7   | Restore explorer state           | Restore expansion, selection, ignored mode, and pane sizes   |
| 8   | Handle protected and error paths | Reject `.git`, traversal, binary, symlink, and stale content |

## Scenario 0: Open Global Workspace Tree

### Starting State

- Several workspaces are registered.
- Kanban may have one active workspace.

### Flow

```text
User opens Explorer
  -> app shows every registered workspace root
  -> app loads indexed item paths for optional decorations
  -> no workspace directory loads until its root expands
```

### Expected Result

- Every registered workspace appears, including empty or unscanned workspaces.
- Browsing does not change the active Kanban workspace.
- Open Kanban explicitly selects one workspace and navigates to its board.

## Scenario 1: Browse Real Directories

### Starting State

- A workspace root is collapsed.

### Flow

```text
User expands workspace
  -> frontend requests tree path=""
  -> backend returns immediate root entries
  -> user expands plans/platform
  -> frontend requests only plans/platform children
```

### Expected Result

- The tree reflects the real workspace directory structure.
- `.git` never appears.
- Git-ignored entries stay hidden unless Show ignored files is enabled.
- Deep descendants remain unloaded until expanded.

## Scenario 2: Preview Supported File

### Starting State

- The user selects Markdown, HTML, JSON, YAML, code, or text.

### Flow

```text
Selection updates route
  -> backend validates workspace-relative path
  -> backend classifies and reads bounded text
  -> PM-006 selects the matching renderer
  -> inspector shows file and Git context
```

### Expected Result

- Supported files render consistently with item details.
- Binary files show an unsupported state without binary content.
- Non-Markdown files remain read-only.

## Scenario 3: Edit Markdown

### Starting State

- A Markdown file is loaded with content and hash.

### Flow

```text
User opens Raw
  -> user edits Markdown
  -> shared editor marks pending state
  -> 900 ms debounce calls workspace file save with expected hash
  -> backend verifies hash and writes atomically
  -> frontend updates saved content, hash, diff, and autosave state
```

### Expected Result

- Preview reflects unsaved editor content.
- Autosave labels match item details.
- Changing selection saves first or stays on the file when save fails.
- Concurrent changes produce the existing stale-content recovery hint.

## Scenario 4: Revert Selected File

### Starting State

- A selected file has a Git diff.

### Flow

```text
User clicks Revert
  -> confirmation names the workspace-relative path
  -> backend validates one file path
  -> Git adapter reverts that path
  -> frontend reloads file, hash, diff, and Git status
```

### Expected Result

- Revert cannot target a directory, `.git`, or path outside the workspace.
- Cancel has no side effect.
- Successful revert records an audit event.

## Scenario 5: Navigate Decorated Item Folder

### Starting State

- A real directory path matches an indexed item path.

### Expected Result

- The directory row shows identifier, title, status, branch, and warning context.
- The row still expands as a normal directory.
- Open details routes to the existing item workspace.
- No duplicate virtual item row appears.

## Scenario 6: Search And Keyboard Navigation

### Flow

```text
Search -> filters loaded workspaces, paths, filenames, and item metadata
Arrow Up/Down -> moves through visible rows
Arrow Right -> expands or moves to first child
Arrow Left -> collapses or moves to parent
Enter -> selects a directory or opens a file
Home/End -> moves to first or last visible row
```

### Expected Result

- Search does not recursively load the filesystem.
- Matching loaded rows retain their ancestors.
- Lazy children do not discard focus.

## Scenario 7: Restore Explorer State

### Starting State

- The user expanded paths, selected a file, resized panes, and changed ignored-file visibility.

### Expected Result

- Route restores workspace and file selection.
- Local preferences restore expansion, pane sizes, and ignored mode.
- Missing or renamed paths fail quietly and select the nearest valid ancestor.
- Pending autosave settles before leaving Explorer.

## Scenario 8: Handle Protected And Error Paths

| Condition              | Expected Result                                    |
|------------------------|----------------------------------------------------|
| `.git` path            | Never listed and rejected by direct API requests   |
| Traversal or absolute  | Rejected before filesystem access                  |
| Outside symlink        | Omitted from tree or rejected on direct access     |
| Git-ignored directory  | Hidden by default and marked when explicitly shown |
| Binary file            | Unsupported preview; no binary bytes returned      |
| Non-Markdown write     | Rejected and editor remains read-only              |
| Stale expected hash    | Save blocked with reload and recovery guidance     |
| Directory load failure | Local retry row; unrelated roots remain usable     |

## Edge Cases

- The workspace root contains thousands of immediate entries.
- The same relative path exists in several workspaces.
- A directory has no children.
- A filename contains spaces or Unicode.
- A selected file is deleted or renamed externally.
- A workspace is removed while Explorer is open.
- An item index is stale while the filesystem remains readable.
- A save touches a configured source and requires targeted item refresh.
