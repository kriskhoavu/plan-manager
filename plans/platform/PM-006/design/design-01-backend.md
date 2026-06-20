# Backend Design: PM-006 File Classification

## Overview

The backend keeps the current file routes and path guards. It adds format metadata and bounded text reads so the frontend can select a renderer safely. No database or new persistence layer is required.

## Current State

- `fileaccess.Tree` lists every file below an item root.
- `fileaccess.Read` reads the selected file into a string without size or binary checks.
- `fileaccess.language` recognizes Markdown, JSON, and YAML. Other files become `text`.
- `FileContent` returns `id`, `path`, `content`, `language`, and `hash`.
- `WriteMarkdown` permits only Markdown writes and must remain unchanged.

## API Model

### `FileContent` Additions

| Field       | Type       | Required | Purpose                                                               |
|-------------|------------|----------|-----------------------------------------------------------------------|
| `kind`      | `FileKind` | Yes      | Select the Markdown, HTML, structured, code, text, or fallback viewer |
| `sizeBytes` | `int64`    | Yes      | Let the viewer explain and control large-file behavior                |
| `truncated` | `bool`     | No       | Report that the response contains a bounded text prefix               |
| `editable`  | `bool`     | Yes      | Keep write capability explicit; true only for Markdown                |

Existing fields remain unchanged. JSON clients that ignore the new fields continue to work.

### `FileKind`

| Value         | Examples                            | Viewer Behavior                    |
|---------------|-------------------------------------|------------------------------------|
| `markdown`    | `.md`, `.markdown`                  | GFM, code, and KaTeX               |
| `html`        | `.html`, `.htm`                     | Sanitized sandbox preview + source |
| `json`        | `.json`                             | Structured tree + source           |
| `yaml`        | `.yaml`, `.yml`                     | Structured tree + source           |
| `code`        | `.go`, `.ts`, `.tsx`, `.css`, `.sh` | Highlighted source                 |
| `text`        | `.txt`, `.log`, extensionless text  | Escaped source                     |
| `unsupported` | Binary or blocked content           | Unsupported state                  |

## Language Mapping

`classify.go` owns one extension table. It returns both `FileKind` and syntax language. The first implementation covers formats already common in this repository:

- Go, JavaScript, TypeScript, JSX, and TSX.
- CSS, HTML, XML, SQL, Shell, Dockerfile, and Makefile.
- JSON, YAML, Markdown, and plain text.
- Java, Kotlin, Python, Ruby, Rust, C, C++, C#, and properties files.

Unknown text extensions use `kind=text` and `language=text`.

## Read Policy

| Rule                   | Behavior                                                                    |
|------------------------|-----------------------------------------------------------------------------|
| Path validation        | Reuse `safeItemPath`, `resolveFile`, and symlink checks                     |
| Binary detection       | Sample the first bytes and reject NUL-heavy or invalid text                 |
| Rich preview threshold | Frontend avoids parsing or highlighting above the configured threshold      |
| Maximum API text bytes | Read a bounded prefix and set `truncated=true`                              |
| Content hash           | Hash the full file only when needed for existing editable Markdown behavior |
| Markdown writes        | Keep `WriteMarkdown` and stale hash checks unchanged                        |

Thresholds must be named constants and covered by boundary tests. Start with a 1 MiB rich preview threshold and a 2 MiB maximum text response. Adjust only after measurement.

## API Contract

| Method | Endpoint                         | Change                                                     |
|--------|----------------------------------|------------------------------------------------------------|
| `GET`  | `/api/items/{id}/files/{fileID}` | Add viewer metadata to the existing `FileContent` response |
| `POST` | `/api/items/{id}/files/{fileID}` | No contract change; non-Markdown writes remain rejected    |

Unsupported binary content should map to a clear client error without exposing file contents. The existing route remains the only file-read route.

## Error Mapping

| Condition                  | Result                                            |
|----------------------------|---------------------------------------------------|
| File not found             | Existing not-found behavior                       |
| Path or symlink escape     | Existing guarded error                            |
| Binary content             | Client error with `unsupported file content`      |
| Read failure               | Existing server error mapping                     |
| File exceeds maximum bytes | Successful bounded response with `truncated=true` |

## Test Strategy

- Table tests for extensions, special filenames, and case handling.
- Boundary tests for rich and maximum preview sizes.
- Binary and invalid UTF-8 tests.
- Regression tests for Markdown read, hash, stale write, and symlink protection.
- API tests that prove old fields and routes remain stable.

## Design Decisions

| Decision                                | Rationale                                                                |
|-----------------------------------------|--------------------------------------------------------------------------|
| Extend the current response             | Avoid a second route and preserve existing clients                       |
| Classify in `fileaccess`                | Keep file policy close to guarded reads                                  |
| Keep parsing in the frontend            | Markdown, HTML, JSON, YAML, and KaTeX are presentation concerns          |
| Bound reads before rendering            | Prevent large or binary files from consuming excessive browser resources |
| Keep Markdown as the only writable kind | Avoid changing authoring rules in a viewer feature                       |
| Add no persistent data                  | Viewer state is transient and file-derived                               |
