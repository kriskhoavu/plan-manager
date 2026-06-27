# Frontend Design: Workspace Registration Modes

## Overview

`WorkspacesPage` should let users choose between `Local Path` and `Remote Git URL` registration. The remote mode should collect clone inputs and submit one create request that the backend handles.

## UX Changes

| Area | Change |
|------|--------|
| Register form header | Add mode selector: `Local Path` / `Remote Git URL` |
| Local mode fields | Keep existing path input, browse, drag/drop behavior |
| Remote mode fields | Show `Remote URL` and `Clone Root` fields; hide local-path dropzone |
| Submit button | Keep one action (`Register Workspace`) with mode-specific validation |
| Registered list | Show local path as today; optional small badge for remote-managed workspace |

## Form Behavior

- Shared fields stay: workspace name, baseline branch, sources.
- Mode defaults to `Local Path`.
- In remote mode:
  - auto-suggest workspace name from repository slug when name is blank/default.
  - keep `Browse` helper for clone root selection.
  - disable drag/drop path behavior specific to local path mode.

## API Integration

Update TypeScript types:

- `WorkspaceInput` gains `registrationMode`, `remoteUrl`, `cloneRoot`.
- `WorkspaceConfig` gains optional remote metadata display fields.

`api.createWorkspace` continues to call `POST /api/workspaces` with expanded body.

## Error UX

- Map backend clone and validation errors into existing notice panel.
- Use mode-specific titles:
  - `Remote workspace registration failed`
  - `Local workspace registration failed`

## Tests

Update/add tests in:

- `web/src/pages/WorkspacesPage.test.ts`
- `web/src/shared/api/index.test.ts`

Cover:

- mode toggle renders correct fields
- remote payload shape is sent correctly
- local mode payload remains backward compatible
- backend error message is surfaced in notice panel
