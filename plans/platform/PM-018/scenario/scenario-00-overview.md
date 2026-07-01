# Scenarios: PM-018 External AI Session Launch

## Scenario List

| #   | Title                          | Expected Result                                                 |
|-----|--------------------------------|-----------------------------------------------------------------|
| 1   | Brainstorm a selected item     | AI opens at the workspace root with the item context manifest   |
| 2   | Implement a structured item    | Implementation intent is available and included in the manifest |
| 3   | Incomplete implementation item | Implementation is disabled with missing-document guidance       |
| 4   | Missing provider or terminal   | Launch is blocked with an actionable capability error           |
| 5   | Invalid custom template        | Settings reject unknown placeholders before process execution   |
| 6   | Snapshot-only item             | Launch is blocked because the session cannot edit that snapshot |

## Flow 1: Launch an External Session

```text
User selects Open AI session
  -> UI loads detected capabilities and saved settings
  -> user selects provider, terminal, and intent
  -> backend resolves the indexed item and registered workspace
  -> backend validates eligibility, executable, and template
  -> backend writes a private context manifest
  -> terminal adapter starts the provider in the workspace root
  -> API returns the accepted launch result
```

## Flow 2: Reject an Unsafe Launch

```text
Launch request
  -> workspace, item, intent, or template validation fails
  -> no context-dependent process starts
  -> blocked audit event records identifiers but not prompt content
  -> UI displays the recovery hint
```

## Acceptance Scenarios

- Detection distinguishes installed, missing, overridden, and invalid tools.
- Provider authentication remains owned by each CLI.
- Brainstorming is available for any editable working-tree item.
- Implementation requires valid `plan.yaml` and `implementation-plan.md` beneath the item root.
- Context files use mode `0600`, remain outside Git workspaces, and expire after 24 hours.
- Launch commands cannot introduce unapproved shell fragments through settings or item values.
