# Backend Design: PM-007 Workspace Files

## Overview

The backend adds guarded workspace-root file operations. It lists one directory level at a time and supports classified text reads, Markdown saves, single-file diffs, and reverts. Existing item-scoped APIs remain unchanged.

## Current State

- The registry validates and stores registered Git workspace roots.
- `internal/fileaccess` guards paths below indexed item roots.
- `internal/security/pathguard` provides shared safe joins.
- PM-006 classifies text formats, rejects binary content, and limits response size.
- Item details allow Markdown writes with content hashes.
- Git diff and revert already support validated item paths.
- Audit events record writes and Git operations.

## Package Structure

```text
internal/workspacefiles/
├── access.go
├── classify.go
├── ignore.go
└── access_test.go

internal/application/workspacefiles/
├── service.go
└── service_test.go
```

Classification should move to or be exported from a shared package. Item and workspace file access must use one format policy.

## Data Model

### `WorkspaceDirectoryListing`

| Field         | Type                   | Purpose                                    |
|---------------|------------------------|--------------------------------------------|
| `workspaceId` | `string`               | Registered workspace ID                    |
| `path`        | `string`               | Normalized root-relative directory path    |
| `entries`     | `[]WorkspaceTreeEntry` | Immediate child entries                    |
| `hiddenCount` | `int`                  | Ignored entries omitted from this response |

### `WorkspaceTreeEntry`

| Field         | Type       | Purpose                                   |
|---------------|------------|-------------------------------------------|
| `id`          | `string`   | Stable ID derived from workspace and path |
| `name`        | `string`   | Base name                                 |
| `path`        | `string`   | Normalized root-relative path             |
| `type`        | `string`   | `directory` or `file`                     |
| `hasChildren` | `bool`     | Directory can be expanded                 |
| `ignored`     | `bool`     | Path matches Git ignore rules             |
| `hidden`      | `bool`     | Base name starts with `.`                 |
| `kind`        | `FileKind` | File format group when type is file       |
| `language`    | `string`   | Syntax language when type is file         |
| `sizeBytes`   | `int64`    | File size                                 |
| `editable`    | `bool`     | True only for allowed Markdown files      |

### `WorkspaceFileContent`

Reuse the existing `FileContent` fields and add `workspaceId` only if the frontend contract requires it. `path` is the canonical workspace-relative identity. Do not create a second classification vocabulary.

### `WorkspaceFileSaveInput`

| Field          | Type     | Purpose                              |
|----------------|----------|--------------------------------------|
| `path`         | `string` | Workspace-relative file path         |
| `content`      | `string` | New Markdown content                 |
| `expectedHash` | `string` | Required optimistic concurrency hash |

### `WorkspaceFileRevertInput`

| Field  | Type     | Purpose                       |
|--------|----------|-------------------------------|
| `path` | `string` | Validated file path to revert |

## Path Safety

Every operation must:

1. Resolve the registered workspace by ID.
2. Reject empty file paths where a file is required.
3. Normalize slash-separated relative paths.
4. Reject absolute paths, traversal, and `.git` path segments.
5. Join through `pathguard.SafeJoin`.
6. Resolve symlinks and confirm the real path remains below the real workspace root.
7. Confirm expected file or directory type.

Directory symlinks that resolve outside the root are omitted from listings. File symlinks outside the root return a guarded client error.

## Directory Listing

- Read only the requested directory with `os.ReadDir`.
- Sort directories first, then files with existing natural ordering.
- Never recurse to populate descendants.
- Set `hasChildren` without recursively walking. A bounded immediate check is allowed.
- Exclude `.git` unconditionally.
- Batch immediate child paths through Git ignore detection.
- Omit ignored entries unless `includeIgnored=true`.
- Keep hidden non-ignored entries visible initially.
- Return file classification and size without reading file content.

Git ignore detection should use a bounded Git adapter call such as `git check-ignore --stdin`. Failure to check ignore rules should return a warning or conservative result, not expose `.git`.

## Read And Write Rules

### Read

- Reuse PM-006 binary detection, classification, limits, and hashes.
- Allow supported text files anywhere inside the guarded workspace root.
- Return unsupported-content errors without binary bytes.

### Write

- Permit only Markdown according to the shared classification.
- Require a non-empty expected hash.
- Compare the current full-file hash before writing.
- Preserve the existing file permission bits.
- Write atomically through a temporary file and rename when supported.
- Return updated classified content and hash.
- Append an audit event with workspace ID and path.

This expands Markdown editing from item roots to the full registered workspace. It does not expand editing to other file formats.

## Diff And Revert

- Diff uses `git diff --no-ext-diff -- {path}` through the Git adapter.
- Revert accepts one validated file path.
- Revert requires an explicit frontend confirmation.
- Revert uses the existing guarded Git path behavior.
- Diff and revert never accept directories.
- Successful revert appends an audit event and updates app state.
- A workspace rescan is required only when the path is below a configured source. Other file changes update state without a full item scan.

## API Contract

| Method | Endpoint                            | Query / Body               | Response                    |
|--------|-------------------------------------|----------------------------|-----------------------------|
| `GET`  | `/api/workspaces/{id}/tree`         | `path`, `includeIgnored`   | `WorkspaceDirectoryListing` |
| `GET`  | `/api/workspaces/{id}/files`        | `path`                     | `FileContent`               |
| `PUT`  | `/api/workspaces/{id}/files`        | `WorkspaceFileSaveInput`   | `FileContent`               |
| `GET`  | `/api/workspaces/{id}/files/diff`   | `path`                     | `{ diff: string }`          |
| `POST` | `/api/workspaces/{id}/files/revert` | `WorkspaceFileRevertInput` | `WorkspaceFileWriteResult`  |

Paths in query parameters use URL encoding. Write and revert bodies repeat the path so audit and validation tests can use typed inputs.

## Application Service

`internal/application/workspacefiles.Service` coordinates:

- Workspace lookup through registry.
- Guarded list, read, and write operations.
- Git ignore, diff, and revert calls.
- Audit event creation.
- Targeted rescan decisions for configured-source paths.
- App-state refresh behavior.

HTTP handlers decode input and map errors. They do not perform path or Git logic.

## Error Mapping

| Condition               | Result                                         |
|-------------------------|------------------------------------------------|
| Unknown workspace       | `404 workspace not found`                      |
| Missing or invalid path | `400 invalid workspace path`                   |
| `.git` path             | `400 protected workspace path`                 |
| Symlink escape          | `400 path escapes workspace`                   |
| Missing entry           | `404 file or directory not found`              |
| Binary content          | `400 unsupported file content`                 |
| Non-Markdown write      | `400 only Markdown files can be edited`        |
| Missing or stale hash   | `409 file content changed since it was loaded` |
| Revert failure          | `400` with existing recovery hint behavior     |

## Performance Budget

- List one directory without recursive traversal.
- Batch ignore checks instead of one Git process per entry.
- Avoid file-content reads during listing.
- Limit directory responses to a documented maximum with a truncation flag if needed.
- Keep listing latency proportional to immediate child count.
- Add a scale test with a large immediate directory and a deep tree that remains unloaded.

## Test Strategy

- Path traversal, absolute path, `.git`, and symlink escape tests.
- Directory-first natural sorting tests.
- Ignored and hidden entry behavior tests.
- Classification and file-size metadata tests.
- Markdown read, atomic save, expected hash, permission, and audit tests.
- Non-Markdown and binary write rejection tests.
- Diff and revert path isolation tests.
- API tests for all routes and error mappings.
- Regression tests for existing item file APIs.

## Design Decisions

| Decision                               | Rationale                                                              |
|----------------------------------------|------------------------------------------------------------------------|
| Add workspace-root file access         | Existing item access intentionally cannot browse outside item roots    |
| Reuse shared classification            | Item detail and Explorer must agree on preview and editability         |
| Load one directory level               | Full recursive trees are expensive and unnecessary                     |
| Hide ignored entries by default        | Dependency and build directories would overwhelm repository navigation |
| Keep `.git` permanently protected      | Git internals must not be browsed or edited                            |
| Keep Markdown-only writes              | Match current details behavior and avoid new validation semantics      |
| Use optimistic hashes and atomic saves | Prevent silent overwrites and partial file content                     |
