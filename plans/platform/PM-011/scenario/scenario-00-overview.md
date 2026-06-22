# Scenarios: PM-011 Overview

## Scenario List

| #   | Title                  | Description                                                |
|-----|------------------------|------------------------------------------------------------|
| 1   | Use primary navigation | Users see Kanban, Explorer, and Workspaces                 |
| 2   | Open item details      | Kanban and search still open `/items/{id}`                 |
| 3   | Open a legacy list URL | `/items` and `/branches` resolve to Kanban                 |
| 4   | Manage branches        | Explorer selects branches and Kanban filters indexed items |

## Expected Behavior

- Desktop and mobile navigation omit Items and Branches.
- Kanban remains the default route.
- Explorer remains available across registered workspaces.
- Item detail pages retain their existing back-to-Kanban flow.
- Global search and recent item links remain valid.
- No removed page component remains in the production bundle.
