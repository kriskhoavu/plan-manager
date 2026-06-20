# Scenarios: PM-006 Overview

## Scenario List

| #   | Title                      | Description                                                        |
|-----|----------------------------|--------------------------------------------------------------------|
| 0   | Existing Markdown workflow | Preserve current preview, raw editing, autosave, and diff behavior |
| 1   | Rich Markdown and KaTeX    | Render GFM, highlighted code fences, and math                      |
| 2   | JSON and YAML data         | Switch between source and a collapsible structured tree            |
| 3   | Source code                | Read highlighted code with line, copy, and wrap controls           |
| 4   | Sandboxed HTML             | Preview sanitized HTML without running scripts                     |
| 5   | Invalid or large content   | Recover from parse errors and avoid expensive rendering            |
| 6   | Unsupported binary content | Explain why the file cannot be shown as text                       |

## Scenario 0: Existing Markdown Workflow

### Starting State

- An item contains `README.md`.
- The user can open it from the Kanban drawer or item workspace.
- Preview, Raw, and Diff tabs exist.

### Flow

```text
User opens README.md
  -> shared viewer renders Markdown in Preview
  -> user switches to Raw and edits content
  -> existing autosave writes Markdown
  -> user switches to Diff and reviews the existing Git diff
```

### Expected Result

- The layout, tab order, autosave timing, and diff behavior do not change.
- Both surfaces render the same Markdown result.

## Scenario 1: Rich Markdown And KaTeX

### Starting State

- A Markdown file contains a table, task list, fenced code, inline math, and block math.

### Flow

```text
File API returns kind=markdown
  -> MarkdownPreview parses GFM and math
  -> code fences receive syntax highlighting
  -> generated HTML passes through the sanitizer
  -> KaTeX styles display inline and block formulas
```

### Expected Result

- Supported Markdown renders without raw script execution.
- Unknown code languages fall back to plain escaped text.
- Copying a code block copies its original source text.

## Scenario 2: JSON And YAML Data

### Starting State

- The selected file is valid `.json`, `.yaml`, or `.yml` content.

### Flow

```text
ContentViewer opens Structured mode
  -> parser creates arrays, objects, and scalar nodes
  -> root and shallow nodes start expanded
  -> user expands or collapses individual nodes
  -> user switches to Source mode when exact text is needed
```

### Expected Result

- Keys, values, types, arrays, and nesting are clear.
- YAML aliases and unsupported custom tags cannot execute code.
- The source text remains unchanged.

## Scenario 3: Source Code

### Starting State

- The selected file has a known source extension such as `.go`, `.ts`, `.tsx`, `.js`, `.css`, `.sh`, or `.sql`.

### Flow

```text
File API returns kind=code and a language
  -> SourceCodeView loads the highlighter
  -> user toggles line wrapping or line numbers
  -> user copies the full file or a code block
```

### Expected Result

- Highlighting never changes the original source.
- Unknown languages use escaped plain text.
- Viewer controls do not resize the surrounding page unexpectedly.

## Scenario 4: Sandboxed HTML

### Starting State

- The selected file is `.html` or `.htm` and contains styles, links, images, or scripts.

### Flow

```text
ContentViewer sanitizes the document
  -> remote resources and unsafe URLs are removed
  -> sanitized content becomes iframe srcDoc
  -> iframe sandbox loads without script or same-origin permission
  -> user can switch back to Source mode
```

### Expected Result

- Scripts and event handlers do not run.
- HTML cannot access the parent document or application storage.
- Blocked content does not break the app shell.

## Scenario 5: Invalid Or Large Content

### Starting State

- JSON or YAML is malformed, or a text file exceeds the rich preview threshold.

### Flow

```text
Parser or size guard stops rich rendering
  -> viewer shows a local error or large-file notice
  -> source mode remains available for allowed text
  -> user can copy or inspect the original content
```

### Expected Result

- The page remains responsive.
- A parse error includes a useful line or position when available.
- Failure in one renderer does not crash the item page.

## Scenario 6: Unsupported Binary Content

### Starting State

- The item folder contains a binary file or an unsupported file type.

### Flow

```text
Backend samples the file and detects binary content
  -> API returns an unsupported-content response
  -> viewer shows the file path, size, and reason
```

### Expected Result

- Binary bytes are not inserted into the DOM.
- Other files in the item remain available.

## Edge Cases

- Empty files show an empty state without a parse error.
- Deep JSON and YAML start collapsed after the configured depth.
- Circular YAML aliases are rejected or bounded during conversion.
- Very long lines scroll or wrap based on the selected control.
- A renderer loading failure falls back to escaped source text.
- Theme changes update viewer colors without reloading the file.
