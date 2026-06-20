# PM-008 Scenario Overview

## Scenario List

| #   | Scenario                      | Expected Result                                                         |
|-----|-------------------------------|-------------------------------------------------------------------------|
| 1   | Search unloaded paths         | Bounded results appear without expanding the tree first                 |
| 2   | Open a search result          | Ancestors expand and route selection opens the matched path             |
| 3   | Show Git decorations          | Loaded rows display normalized workspace Git state                      |
| 4   | Create a Markdown file        | An exclusive `.md` file is created and selected                         |
| 5   | Create a directory            | A guarded directory is created and its parent cache refreshes           |
| 6   | Rename a file or directory    | The path moves without overwrite and selection follows it               |
| 7   | Reject unsafe path operations | Protected, escaping, symlinked, invalid, and occupied paths are blocked |

## Main Flow

```text
User searches or chooses a tree action
  -> frontend validates required fields
  -> API resolves the registered workspace
  -> workspace file service applies path and ignore guards
  -> operation returns matches or a mutation result
  -> frontend refreshes affected caches
  -> route selection reveals the resulting path
```

## Error Flows

- Search stops at the configured work and result limits.
- Empty queries return no results.
- Ignored paths stay excluded unless ignored mode is enabled.
- Create rejects unsupported file extensions and occupied destinations.
- Rename rejects the workspace root, `.git`, outside symlinks, and cross-workspace destinations.
- Failed mutations append blocked or failed audit events and leave selection unchanged.
