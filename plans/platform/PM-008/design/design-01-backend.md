# Backend Design: PM-008 Explorer Productivity

## Overview

Extend `internal/workspacefiles` and `internal/application/workspacefiles` with bounded path search, exclusive create operations, guarded rename, and normalized Git path state. No database or migration is required.

## Data Model

| Model                           | Key Fields                                             |
|---------------------------------|--------------------------------------------------------|
| `WorkspacePathSearchResult`     | workspace ID, name, path, type, ignored, match context |
| `WorkspacePathSearchResponse`   | results, truncated                                     |
| `WorkspaceFileCreateInput`      | parent path, name, content                             |
| `WorkspaceDirectoryCreateInput` | parent path, name                                      |
| `WorkspacePathRenameInput`      | path, destination path                                 |
| `WorkspacePathMutationResult`   | workspace ID, path, type, invalidated directory paths  |
| `WorkspacePathGitState`         | path, old path, status, staged, conflict               |

## Safety Rules

- Reuse workspace root canonicalization and `.git` protection.
- Validate one path segment for create names.
- Require `.md` or `.markdown` for created files.
- Create files with exclusive flags and atomic initial content.
- Create one directory without recursive implicit parents.
- Require an existing source and missing destination for rename.
- Reject root rename and cross-workspace paths.
- Confirm resolved parents and symlink targets remain inside the workspace.
- Never descend through an outside symlink during search.

## Search

- Require a non-empty normalized query.
- Search one workspace when `workspaceId` is present, otherwise all registered workspaces.
- Match case-insensitive base names and relative paths.
- Sort exact base-name matches first, then path depth and natural path order.
- Cap results at 100 and visited entries at 20,000 per request.
- Skip `.git` unconditionally.
- Use Git ignore checks in batches per directory.
- Return `truncated=true` when a limit stops traversal.

## API Contract

| Method | Endpoint                               | Request / Query                      | Response                      |
|--------|----------------------------------------|--------------------------------------|-------------------------------|
| `GET`  | `/api/workspaces/files/search`         | `q`, `workspaceId`, `includeIgnored` | `WorkspacePathSearchResponse` |
| `POST` | `/api/workspaces/{id}/directories`     | `WorkspaceDirectoryCreateInput`      | `WorkspacePathMutationResult` |
| `POST` | `/api/workspaces/{id}/files`           | `WorkspaceFileCreateInput`           | `WorkspacePathMutationResult` |
| `POST` | `/api/workspaces/{id}/paths/rename`    | `WorkspacePathRenameInput`           | `WorkspacePathMutationResult` |
| `GET`  | `/api/workspaces/{id}/git/path-status` | none                                 | `WorkspacePathGitState[]`     |

## Error Mapping

| Condition                 | Status |
|---------------------------|--------|
| Unknown workspace         | 404    |
| Missing source or parent  | 404    |
| Invalid or protected path | 400    |
| Unsupported create format | 400    |
| Occupied destination      | 409    |
| Search or Git failure     | 400    |

## Audit And Refresh

- Record `workspace_file_create`, `workspace_directory_create`, and `workspace_path_rename`.
- Record source and destination paths for rename.
- Refresh the workspace index only when either affected path is below a configured source.
- Return parent directory paths so the frontend can invalidate only affected cache entries.
