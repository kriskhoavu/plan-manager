# Scenarios: PM-016 Overview

## Scenario List

| # | Title                          | Description                                                                 |
|---|--------------------------------|-----------------------------------------------------------------------------|
| 0 | Register Local Workspace       | Existing local path flow continues unchanged                                |
| 1 | Register Remote Workspace      | User provides Git URL + clone root and workspace is cloned and registered   |
| 2 | Remote Clone Failure Handling  | Validation/auth/path failures return clear messages and no partial registry |
| 3 | Edit And Rescan Managed Clone  | Cloned workspace behaves like normal workspace for scan, branch, and files  |

---

# Scenario 1: Register Remote Workspace

## Starting State

- User has valid SSH/HTTPS credentials configured on local machine.
- Workspace list may be empty or already contain local-path workspaces.
- Clone target directory exists and is writable.

## Flow

1. User opens `Workspaces` page and chooses `Remote Git URL` mode.
2. User enters workspace name, remote URL, clone root, baseline branch, and sources.
3. Frontend sends one create request to `POST /api/workspaces`.
4. Backend validates URL format, clone root safety, and duplicate registration risk.
5. Backend clones repo into derived local path under clone root.
6. Backend validates baseline branch and source directories in cloned repo.
7. Backend saves workspace registry entry and returns created workspace.
8. Frontend shows success and workspace appears in registered list.

## Expected Result

- New workspace appears with local path pointing to cloned repository.
- Scan action works without special remote-mode behavior.
- Existing local-path workspaces and routes behave the same as before.

---

# Scenario 2: Remote Clone Failure Handling

## Failure Cases

| Case                                 | Expected Result                                                          |
|--------------------------------------|--------------------------------------------------------------------------|
| Invalid URL format                   | API returns `400` with actionable message                               |
| Authentication/permission failure    | API returns `400` with clone failure text and optional recovery hint     |
| Clone target already has another repo| API returns `400`; no registry entry is created                          |
| Baseline branch missing              | API returns `400`; cloned folder may remain but workspace is not saved   |
| Sources missing in cloned repo       | API returns `400`; user can retry with corrected sources                 |

## Expected Result

- Registry remains consistent (no half-created workspace entries).
- User sees clear error messages and can retry without app restart.
