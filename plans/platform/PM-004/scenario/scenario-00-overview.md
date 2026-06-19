# Scenario 0: Safe Local Operations

## Goal

Help the user trust file and Git operations by showing clear health, audit, and recovery information.

## Starting State

| #   | State      | Summary                                                        |
|-----|------------|----------------------------------------------------------------|
| 1   | Workspace  | User has one or more registered local Git workspaces           |
| 2   | App data   | Registry and item index exist in the app config directory      |
| 3   | Operations | User can scan, edit files, edit metadata, and run Git commands |
| 4   | Risk       | Failures can come from filesystem, Git, stale files, or config |

## Execution Flows

### Flow 0.1: Run Workspace Health Check

```text
User opens workspace health
  -> frontend calls GET /api/workspaces/{id}/health
  -> backend checks path, sources, Git root, branch, index state, and permissions
  -> backend returns checks with pass, warning, or fail
  -> frontend shows grouped results and recovery hints
```

### Flow 0.2: Save A File With Stale Content

```text
User edits Markdown
  -> external tool changes the same file
  -> frontend autosave sends expected hash
  -> backend detects stale hash
  -> backend writes audit failure event
  -> frontend shows conflict state and recovery choices
```

### Flow 0.3: Run Git Operation

```text
User runs pull, push, commit, or branch switch
  -> backend runs safety checks
  -> backend blocks risky operation or runs Git
  -> backend writes audit event
  -> frontend shows result, changed files, and recovery hint
```

## Invariants

| Invariant      | Requirement                                                   |
|----------------|---------------------------------------------------------------|
| Local only     | Audit data stays in the user config directory                 |
| No API break   | Existing API routes continue to work                          |
| No data loss   | Stale writes and risky Git states do not overwrite user files |
| Clear feedback | Failures include a user-facing recovery hint when possible    |

