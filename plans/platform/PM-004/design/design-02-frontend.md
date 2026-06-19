# Frontend Design: Reliability, Safety, And Observability

## Overview

PM-004 adds UI for workspace health, recent operation history, and clearer failure recovery. It should feel like part of the current work app. It should not change the main workflows.

## Data Model

### AuditEvent

| Field       | Type       | Purpose                        |
|-------------|------------|--------------------------------|
| `id`        | `string`   | Event key                      |
| `time`      | `string`   | Event time                     |
| `operation` | `string`   | Operation name                 |
| `status`    | `string`   | `success`, `blocked`, `failed` |
| `message`   | `string`   | Short result text              |
| `paths`     | `string[]` | Related files                  |

### WorkspaceHealth

| Field       | Type            | Purpose              |
|-------------|-----------------|----------------------|
| `summary`   | `string`        | Overall health state |
| `checkedAt` | `string`        | Last check time      |
| `checks`    | `HealthCheck[]` | Ordered health rows  |

## State Management

| Hook                   | Responsibility                              |
|------------------------|---------------------------------------------|
| `useWorkspaceHealth`   | Load health checks for the active workspace |
| `useAuditEvents`       | Load recent audit events                    |
| `useOperationFeedback` | Map backend hints into UI messages          |

## UI Changes

| Area           | Change                                                     |
|----------------|------------------------------------------------------------|
| Workspace page | Add Health panel for selected workspace                    |
| Git panel      | Show recovery hints for blocked and failed operations      |
| Item workspace | Show stale-file conflict state with reload and diff action |
| App shell      | Add small recent activity entry point                      |

## Design Decisions

| Decision                     | Rationale                                            |
|------------------------------|------------------------------------------------------|
| Keep health checks read-only | Users can inspect before changing files              |
| Keep audit as local history  | It supports debugging without cloud behavior         |
| Use compact panels           | This is an operational tool, not a reporting product |
| Reuse current status styling | Visual behavior should stay consistent               |

