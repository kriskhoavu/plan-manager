# Frontend Design: External AI Session Launch

## Overview

Add an AI settings section and an item-level launch dialog. The UI recommends detected tools but keeps selection explicit. It does not emulate a terminal or display provider output.

## Types and API

Add frontend equivalents of `AICapability`, `AISettings`, `LaunchTemplate`, `AISessionLaunchInput`, and `AISessionLaunchResult` to the shared type layer and API facade.

## State Management

| State                      | Owner                  | Behavior                                            |
|----------------------------|------------------------|-----------------------------------------------------|
| Capabilities and settings  | AI settings hook       | Load on entry; explicit refresh reruns detection    |
| Launch selections          | Launch dialog          | Initialize from settings; reset between items       |
| Implementation eligibility | Item detail/API result | Disable intent and show missing requirements        |
| Launch request and error   | Launch dialog          | Prevent duplicate submit and show recovery guidance |

## User Interface

- Settings lists provider and terminal presets with detected state, executable override, argument template, enable toggle, and default selection.
- Item workspace adds an `Open AI session` action.
- Dialog requires provider, terminal, and intent.
- Implement intent displays eligibility and missing files before submit.
- Successful launch closes the dialog and shows a transient confirmation.
- Errors remain in the dialog with backend recovery hints.

## Accessibility

- Dialog traps focus, supports Escape, and restores focus to the launch button.
- Capability state and validation errors use text in addition to color.
- Disabled implementation intent references visible explanatory text.

## Design Decisions

| Decision                          | Rationale                                                    |
|-----------------------------------|--------------------------------------------------------------|
| Keep launch state local to dialog | No active external session is managed by the browser         |
| Require explicit intent selection | Makes implementation an informed action                      |
| Put machine settings globally     | Provider and terminal availability is not workspace metadata |
