# Implementation Plan: PM-016 - Remote Workspace Registration From Git URL

## Overview

Add remote Git URL workspace registration as a second option to the existing local-path flow. Clone should happen on the local machine using the user's existing Git authentication.

## Phases Summary

| Phase | Name                                   | Status |
|-------|----------------------------------------|--------|
| B1    | Backend DTO And Validation Expansion   | Draft  |
| B2    | Clone Service And Registry Integration | Draft  |
| F1    | Workspace Form Mode Toggle             | Draft  |
| F2    | API/Type Updates And Error UX          | Draft  |
| V1    | Characterization, Docs, And Regression | Draft  |

## Terminology Lock

Use consistently:

- `registrationMode`
- `local_path`
- `remote_clone`
- `remoteUrl`
- `cloneRoot`
- `managed clone workspace`

## Backend Phases

### Phase B1: Backend DTO And Validation Expansion

**Deliverables:**

- [ ] Extend `models.WorkspaceInput` and `models.WorkspaceConfig` with mode-aware fields.
- [ ] Keep local mode behavior fully backward compatible.
- [ ] Add mode-specific validation and explicit errors.
- [ ] Update API decoding and response tests for new request/response fields.

**Verification:** `go test ./internal/models ./internal/api ./internal/registry`

---

### Phase B2: Clone Service And Registry Integration

**Deliverables:**

- [ ] Add clone helper to `gitadapter` and integration path in workspace creation service.
- [ ] Derive safe destination folder from repository slug under `cloneRoot`.
- [ ] Validate baseline branch and sources after clone using existing validation paths.
- [ ] Keep duplicate path checks and avoid partial registry writes.

**Verification:** `go test ./internal/gitadapter ./internal/application/workspace ./internal/registry ./internal/api`

---

## Frontend Phases

### Phase F1: Workspace Form Mode Toggle

**Deliverables:**

- [ ] Add local/remote mode selector in `WorkspacesPage` registration form.
- [ ] Keep local path browse/drop UX intact for local mode.
- [ ] Add remote URL and clone root fields for remote mode.
- [ ] Auto-suggest workspace name from remote repo when suitable.

**Verification:** `npm run typecheck && npm run test -- web/src/pages/WorkspacesPage.test.ts`

---

### Phase F2: API/Type Updates And Error UX

**Deliverables:**

- [ ] Extend TypeScript workspace input/config types and API normalization.
- [ ] Send mode-aware payload to `POST /api/workspaces`.
- [ ] Show mode-specific error and success notices.
- [ ] Keep workspace edit/remove/scan behavior unchanged.

**Verification:** `npm run typecheck && npm run test -- web/src/shared/api/index.test.ts web/src/pages/WorkspacesPage.test.ts`

---

## Phase V1: Characterization, Docs, And Regression

**Deliverables:**

- [ ] Add characterization tests proving local registration flow is unchanged.
- [ ] Add regression tests for remote clone success/failure paths.
- [ ] Update `README.md` and `ARCHITECTURE.md` workspace registration docs.
- [ ] Confirm full backend/frontend test suites pass.

**Verification:** `go test ./... && npm run typecheck && npm test -- --run`

## Post-Implementation Checklist

- [ ] Local-path workspace registration remains fully compatible.
- [ ] Remote clone supports HTTPS and SSH URLs.
- [ ] No workspace registry entry is saved when remote clone registration fails.
- [ ] Cloned workspace works with scan, branch load, explorer, and item flows.
