# Scenarios: PM-010 Overview

## Scenario List

| #   | Title                    | Description                                           |
|-----|--------------------------|-------------------------------------------------------|
| 1   | View workspace branches  | Explorer shows the current branch for each workspace  |
| 2   | Switch a clean workspace | One workspace reloads files from another branch       |
| 3   | Protect local changes    | Explorer blocks checkout when the workspace is dirty  |
| 4   | Independent workspaces   | Switching one repository leaves other roots unchanged |

## Scenario 1: View Workspace Branches

- Each workspace root shows its current branch.
- Opening the selector lists local branches from that repository.
- Failure to inspect one repository does not hide other workspace roots.

## Scenario 2: Switch a Clean Workspace

1. The user chooses another local branch.
2. Explorer disables that workspace selector while checkout runs.
3. The backend checks out the branch and refreshes indexed items.
4. Explorer clears the selected file if it belongs to the switched workspace.
5. Explorer reloads expanded directories and Git file states for that workspace.

## Scenario 3: Protect Local Changes

- A dirty editor saves before checkout and therefore makes the working tree dirty.
- Explorer does not bypass the backend dirty-tree guard.
- The selector returns to the actual current branch.
- The UI explains that the user must commit, revert, or otherwise clean the workspace.

## Scenario 4: Independent Workspaces

- Workspace A can use `feature/a` while workspace B remains on `main`.
- Switching workspace A does not clear workspace B tree data.
- Search reads the checked-out branch of every included workspace.

## Edge Cases

- Detached HEAD appears as `HEAD` and remains visible.
- An empty branch list still includes the current branch when available.
- A branch deleted after loading produces an error and refreshes the selector.
- A file missing on the new branch closes instead of showing stale content.
