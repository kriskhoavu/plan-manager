# PM-008: Explorer Productivity Enhancements

PM-008 extends the Workspace Explorer with guarded creation and rename actions, repository-wide path search, and Git status decorations. It builds on PM-007 without changing Kanban scope or weakening workspace file safety.

## Related Plans

| Ticket                        | Relationship    | Key Context                                                                    |
|-------------------------------|-----------------|--------------------------------------------------------------------------------|
| [PM-007](../PM-007/README.md) | Parent feature  | Added the global lazy tree, guarded workspace file APIs, editor, and inspector |
| [PM-006](../PM-006/README.md) | Related feature | Defines supported content kinds and Markdown editability                       |

### What PM-007 Established

- **Workspace Explorer**: the global `/explorer` route.
- **Workspace Tree Entry**: one real file or directory below a registered root.
- **Directory Listing**: one lazy page of immediate children.
- **Selection**: the route-backed workspace and relative path.
- **Write Guard**: traversal, `.git`, symlink, stale-hash, and file-kind checks.
- **Ignored Entry**: a path excluded by Git ignore rules unless explicitly shown.

## Goals

- Find matching paths even when their parent directories are not expanded.
- Show modified, added, deleted, renamed, untracked, and conflicted Git state in the tree.
- Create Markdown files and directories from Explorer.
- Rename files and directories inside one workspace.
- Refresh only affected tree caches and item data.
- Preserve current preview, editor, selection, and keyboard behavior.

## Glossary

| Term                   | Meaning                                                          | Code Target                     |
|------------------------|------------------------------------------------------------------|---------------------------------|
| Path Search Result     | One bounded match from an unloaded or loaded workspace path      | `WorkspacePathSearchResult`     |
| Path Git State         | Normalized Git state attached to one workspace-relative path     | `WorkspacePathGitState`         |
| Create File Input      | Parent path, Markdown name, and initial content                  | `WorkspaceFileCreateInput`      |
| Create Directory Input | Parent path and directory name                                   | `WorkspaceDirectoryCreateInput` |
| Rename Path Input      | Existing source path and unoccupied destination path             | `WorkspacePathRenameInput`      |
| Search Scope           | One workspace or all registered workspaces                       | `workspaceId`                   |
| Ancestor Expansion     | Opening every parent row required to reveal a selected result    | `expandToPath`                  |
| Tree Mutation Result   | Updated path plus the directories whose caches must be refreshed | `WorkspacePathMutationResult`   |

## Out Of Scope

- Deleting files or directories.
- Moving paths between workspaces.
- Overwriting an existing destination.
- Creating or editing binary files.
- Editing non-Markdown file content.
- Exposing `.git` internals.
- Running commit, fetch, pull, push, or branch mutations from Explorer.
- Building a persistent external search index.

## Data Flow

```text
Search query
  -> bounded workspace traversal
  -> protected and ignored paths skipped
  -> result selection expands ancestors
  -> route selects the matched path

Create or rename
  -> validate source, parent, and destination
  -> perform exclusive filesystem operation
  -> append audit event
  -> refresh affected item source and tree caches
  -> select the resulting path
```

## Design Decisions

| Decision                           | Alternatives Considered          | Rationale                                                       |
|------------------------------------|----------------------------------|-----------------------------------------------------------------|
| Use bounded on-demand path search  | Add a persistent search index    | Workspaces stay the source of truth without new stored state    |
| Create Markdown only               | Create arbitrary file formats    | Matches the existing editable-content safety boundary           |
| Rename without overwrite           | Replace the destination          | Prevents destructive and ambiguous filesystem operations        |
| Reuse Git status output            | Run Git once for every tree row  | One workspace call scales with loaded tree size                 |
| Invalidate affected directory keys | Clear the complete Explorer tree | Preserves unrelated lazy directory state and reduces refetching |

## Documents

- [Ticket](ticket.md)
- [Scenarios](scenario/scenario-00-overview.md)
- [Backend Design](design/design-01-backend.md)
- [Frontend Design](design/design-02-frontend.md)
- [Implementation Plan](implementation-plan.md)
- [PM-007 Parent Plan](../PM-007/README.md)
