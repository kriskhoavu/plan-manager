# Implementation Plan: PM-018 - External AI Session Launch

## Overview

Deliver provider detection, secure context generation, macOS external-terminal launch, and the configuration and item launch interfaces.

## Phases Summary

| Phase | Name                               | Status |
|-------|------------------------------------|--------|
| B1    | Capability And Settings Foundation | Done   |
| B2    | Context And Launch Service         | Done   |
| F1    | AI Settings                        | Done   |
| F2    | Item Launch Workflow               | Draft  |
| V1    | Integrated Verification            | Draft  |

## Phase B1: Capability And Settings Foundation

**Deliverables:**

- [x] Add AI settings models and `<data-dir>/ai-settings.yaml` store.
- [x] Detect supported providers and macOS terminals without starting them.
- [x] Validate executable paths, defaults, and approved template placeholders.
- [x] Add capability and settings endpoints with unit and API tests.

**Verification:** `go test ./internal/application/aisession ./internal/aisettings ./internal/api`

**Commit:** `PM-018: Add AI capability and settings foundation`

## Phase B2: Context And Launch Service

**Deliverables:**

- [x] Add item eligibility and workspace containment validation.
- [x] Generate private context manifests and 24-hour cleanup.
- [x] Add provider commands, Terminal/iTerm2/WezTerm adapters, and injected process runner.
- [x] Add launch endpoint, stable errors, audit events, and adapter tests.

**Verification:** `go test ./internal/application/aisession ./internal/ailaunch ./internal/api`

**Commit:** `PM-018: Launch external AI sessions with item context`

## Phase F1: AI Settings

**Deliverables:**

- [x] Add shared API types and methods.
- [x] Add capability/settings hook and Settings page section.
- [x] Support detected recommendations, explicit defaults, overrides, validation, and refresh.
- [x] Add interaction and error-state tests.

**Verification:** `npm run typecheck && npm test -- --run web/src/features/ai-settings`

**Commit:** `PM-018: Add AI provider and terminal settings`

## Phase F2: Item Launch Workflow

**Deliverables:**

- [ ] Add item action and accessible launch dialog.
- [ ] Add provider, terminal, and intent selection.
- [ ] Display implementation eligibility and recovery guidance.
- [ ] Add successful, blocked, missing-tool, and duplicate-submit tests.

**Verification:** `npm run typecheck && npm test -- --run web/src/pages/ItemWorkspacePage.test.ts web/src/features/ai-session`

**Commit:** `PM-018: Add item AI session launch workflow`

## Phase V1: Integrated Verification

**Deliverables:**

- [ ] Verify built-in adapters with fake executables and process runners.
- [ ] Verify no manifest or wrapper is written inside a workspace.
- [ ] Update architecture, requirements baseline, and user documentation.
- [ ] Run full backend, frontend, and production build checks.

**Verification:** `go test ./... && npm run typecheck && npm test -- --run && npm run build && go build ./cmd/plan-manager`

**Commit:** `PM-018: Verify external AI session launch`
