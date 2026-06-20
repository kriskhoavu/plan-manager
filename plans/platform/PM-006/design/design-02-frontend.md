# Frontend Design: PM-006 Rich Content Viewer

## Overview

The frontend adds a shared `ContentViewer` feature. Both `ItemWorkspacePage` and the Kanban preview drawer pass the selected `FileContent` into it. The component owns format selection, safe parsing, renderer loading, viewer controls, and local errors. Existing pages keep file loading, editing, autosave, diff, metadata, and Git state.

## Current State

- Both preview surfaces import `marked` and call `marked.parse()` directly.
- Both insert generated HTML with `dangerouslySetInnerHTML`.
- The preview code has no explicit sanitization step.
- JSON, YAML, HTML, and code files use the same Markdown path.
- Viewer styles are duplicated under `.markdown-preview` and `.drawer-markdown`.

## Dependencies

| Package                  | Purpose                                            | Loading Strategy          |
|--------------------------|----------------------------------------------------|---------------------------|
| `unified`                | Run the Markdown parse and render pipeline         | Markdown renderer chunk   |
| `remark-parse`           | Parse Markdown                                     | Markdown renderer chunk   |
| `remark-gfm`             | Tables, task lists, autolinks, and strikethrough   | Markdown renderer chunk   |
| `remark-math`            | Parse inline and block math                        | Markdown renderer chunk   |
| `remark-rehype`          | Convert Markdown syntax trees to HTML syntax trees | Markdown renderer chunk   |
| `rehype-sanitize`        | Enforce the Markdown output allowlist              | Markdown renderer chunk   |
| `rehype-katex` / `katex` | Render math                                        | Markdown renderer chunk   |
| `rehype-highlight`       | Highlight fenced Markdown code                     | Markdown renderer chunk   |
| `rehype-stringify`       | Produce sanitized HTML                             | Markdown renderer chunk   |
| `dompurify`              | Sanitize standalone HTML before iframe rendering   | HTML renderer chunk       |
| `highlight.js`           | Highlight source files and fallback code blocks    | Source renderer chunk     |
| `yaml`                   | Parse YAML with safe schema and alias limits       | Structured renderer chunk |

The implementation should verify bundle size before accepting these packages. Import only required syntax languages where the library permits it.

## Types

```typescript
type FileKind = 'markdown' | 'html' | 'json' | 'yaml' | 'code' | 'text' | 'unsupported';
type ViewerMode = 'rendered' | 'structured' | 'source';

interface ContentViewerProps {
  file: FileContent;
  content: string;
  compact?: boolean;
}
```

`ContentViewer` does not own editable content. The pages pass `editorContent` so preview updates still follow existing edit state.

## Component Responsibilities

| Component            | Responsibility                                                               |
|----------------------|------------------------------------------------------------------------------|
| `ContentViewer`      | Select adapter, mode, fallback, error boundary, and lazy loading             |
| `ViewerToolbar`      | Mode selector, copy, wrapping, and line-number controls                      |
| `MarkdownPreview`    | GFM, math, code fences, heading links, and strict sanitized output           |
| `HtmlPreview`        | DOMPurify policy, iframe `srcDoc`, sandbox, and blocked-resource messaging   |
| `StructuredDataView` | JSON/YAML parsing, bounded recursive tree, expansion state, and parse errors |
| `SourceCodeView`     | Escaped highlighting, line numbers, copy, wrapping, and plain-text fallback  |
| `ViewerError`        | Local renderer error that never replaces the full page                       |
| `TreeNode`           | One accessible object, array, or scalar node                                 |

## Mode Rules

| File Kind     | Default Mode | Available Modes    |
|---------------|--------------|--------------------|
| `markdown`    | Rendered     | Rendered, Source   |
| `html`        | Rendered     | Rendered, Source   |
| `json`        | Structured   | Structured, Source |
| `yaml`        | Structured   | Structured, Source |
| `code`        | Source       | Source             |
| `text`        | Source       | Source             |
| `unsupported` | None         | Unsupported state  |

Mode state resets only when the selected file changes. It does not replace the page-level Preview, Raw, and Diff tabs. The rich viewer lives inside the existing Preview tab.

## Markdown Pipeline

```text
remarkParse
  -> remarkGfm
  -> remarkMath
  -> remarkRehype (raw HTML disabled)
  -> rehypeSanitize (explicit schema)
  -> rehypeKatex
  -> rehypeHighlight
  -> rehypeStringify
```

The sanitizer runs before plugins that add KaTeX and highlight markup. The final schema and plugin order need security tests. External links add `rel="noreferrer noopener"`. Unsafe URL schemes are removed.

## HTML Sandbox

- Sanitize HTML with a dedicated allowlist.
- Remove scripts, event handlers, forms, embeds, frames, and unsafe URLs.
- Remove or block remote `src`, `href`, CSS imports, and URL values by default.
- Add a restrictive Content Security Policy to `srcDoc`.
- Use `<iframe sandbox="">` without script, form, popup, download, or same-origin permissions.
- Size the frame within the existing preview area.
- Keep source mode available for exact inspection.

## Structured Data Safety

- Use `JSON.parse` for JSON.
- Parse YAML without custom executable tags.
- Set strict alias and node limits.
- Convert parsed values into plain arrays, objects, and scalar values.
- Render keys and values as React text, never HTML.
- Stop automatic expansion at a bounded depth and node count.

## State And Data Flow

```text
Page owns selected file and editable text
  -> ContentViewer receives immutable props
  -> local state owns viewer mode and display controls
  -> lazy adapter returns rendered output or local error
  -> file ID change resets mode and expansion state
```

No global store or API query layer is needed.

## Accessibility

- Use tabs or a segmented control with correct selected state for viewer modes.
- Give icon buttons accessible names and tooltips.
- Make tree nodes keyboard expandable with buttons and `aria-expanded`.
- Keep copy feedback available to screen readers.
- Preserve text contrast in both themes.
- Keep line numbers out of copied source text.

## Styling

- Preserve the current preview padding, typography, and scroll ownership.
- Use feature-owned CSS under one `.content-viewer` root.
- Keep compact drawer rules separate from full workspace rules.
- Add stable toolbar height and source grid dimensions.
- Import KaTeX CSS only with the Markdown renderer.
- Use existing color variables and border radii.

## Test Strategy

- Unit tests for format and mode selection.
- Sanitization tests with scripts, handlers, unsafe URLs, and raw Markdown HTML.
- Rendering tests for GFM, KaTeX, known and unknown code languages.
- JSON/YAML tree and parse-error tests.
- Interaction tests for expand, collapse, copy, wrap, lines, and mode changes.
- Integration tests proving both page surfaces use the shared viewer.
- Browser checks at desktop and mobile widths in both themes.
- Bundle comparison and a large-file responsiveness check.

## Design Decisions

| Decision                               | Rationale                                                         |
|----------------------------------------|-------------------------------------------------------------------|
| Keep page state outside the viewer     | Avoid coupling rendering to file loading, autosave, diff, or Git  |
| Lazy-load format adapters              | Do not charge every page for KaTeX, YAML, HTML, and highlighting  |
| Render structured values as React text | Eliminate HTML injection paths in JSON and YAML                   |
| Keep source as the universal fallback  | Users can inspect content when parsing or rich rendering fails    |
| Use one feature-owned stylesheet       | Keep viewer rules reusable without changing unrelated page styles |
