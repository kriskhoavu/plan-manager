#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

PORT="${PLAN_MANAGER_PORT:-4317}"
BIN="$ROOT_DIR/bin/plan-manager"
RUN_DIR="$ROOT_DIR/.run"
PID_FILE="$RUN_DIR/plan-manager.pid"
LOG_FILE="$RUN_DIR/plan-manager.log"

usage() {
  cat <<EOF
Usage: ./run.sh {start|stop|restart|status}

Environment:
  PLAN_MANAGER_PORT   Port to bind, default: 4317

Logs:
  $LOG_FILE
EOF
}

pid_value() {
  if [[ -f "$PID_FILE" ]]; then
    cat "$PID_FILE"
  fi
}

is_running() {
  local pid
  pid="$(pid_value)"
  [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null
}

process_command() {
  local pid="$1"
  ps -p "$pid" -o command= 2>/dev/null || true
}

is_plan_manager_process() {
  local pid="$1"
  local command
  command="$(process_command "$pid")"
  [[ "$command" == *"plan-manager serve"* ]]
}

build_app() {
  echo "Building frontend assets..."
  npm run build

  echo "Building Go binary..."
  mkdir -p "$ROOT_DIR/bin"
  go build -o "$BIN" ./cmd/plan-manager
}

port_owner() {
  if command -v lsof >/dev/null 2>&1; then
    lsof -nP -iTCP:"$PORT" -sTCP:LISTEN -t 2>/dev/null | head -n 1 || true
  fi
}

stop_pid() {
  local pid="$1"
  echo "Stopping Plan Manager PID $pid ..."
  kill "$pid"

  for _ in {1..30}; do
    if ! kill -0 "$pid" 2>/dev/null; then
      rm -f "$PID_FILE"
      echo "Stopped."
      return 0
    fi
    sleep 0.2
  done

  echo "Process did not exit after SIGTERM; sending SIGKILL."
  kill -9 "$pid" 2>/dev/null || true
  rm -f "$PID_FILE"
  echo "Stopped."
}

start_app() {
  mkdir -p "$RUN_DIR"

  if is_running; then
    stop_pid "$(pid_value)"
  fi

  if [[ -f "$PID_FILE" ]]; then
    echo "Removing stale PID file."
    rm -f "$PID_FILE"
  fi

  local existing_owner
  existing_owner="$(port_owner)"
  if [[ -n "$existing_owner" ]] && is_plan_manager_process "$existing_owner"; then
    stop_pid "$existing_owner"
  fi

  build_app

  local owner
  owner="$(port_owner)"
  if [[ -n "$owner" ]]; then
    echo "Port $PORT is already in use by PID $owner; not starting."
    echo "Set PLAN_MANAGER_PORT to another port or stop that process."
    exit 1
  fi

  echo "Starting Plan Manager on http://127.0.0.1:$PORT ..."
  nohup "$BIN" serve -port "$PORT" >"$LOG_FILE" 2>&1 &
  echo "$!" >"$PID_FILE"

  sleep 1
  if ! is_running; then
    echo "Plan Manager failed to start. Recent logs:"
    tail -n 40 "$LOG_FILE" || true
    rm -f "$PID_FILE"
    exit 1
  fi

  echo "Started PID $(pid_value)."
  echo "Log: $LOG_FILE"
  echo "Open: http://127.0.0.1:$PORT"
}

stop_app() {
  if is_running; then
    stop_pid "$(pid_value)"
    return 0
  fi

  if [[ -f "$PID_FILE" ]]; then
    echo "Removing stale PID file."
    rm -f "$PID_FILE"
  fi

  local owner
  owner="$(port_owner)"
  if [[ -n "$owner" ]]; then
    if is_plan_manager_process "$owner"; then
      stop_pid "$owner"
      return 0
    fi
    echo "Port $PORT is in use by PID $owner, but it is not a Plan Manager process."
    return 0
  fi

  echo "Plan Manager is not running."
}

status_app() {
  if is_running; then
    echo "Plan Manager is running with PID $(pid_value)."
    echo "Open http://127.0.0.1:$PORT"
    echo "Log: $LOG_FILE"
    return 0
  fi

  local owner
  owner="$(port_owner)"
  if [[ -n "$owner" ]] && is_plan_manager_process "$owner"; then
    echo "Plan Manager is running with PID $owner."
    echo "Open http://127.0.0.1:$PORT"
    echo "Log: unmanaged process; no $LOG_FILE"
  else
    echo "Plan Manager is not running."
  fi
}

case "${1:-}" in
  start)
    start_app
    ;;
  stop)
    stop_app
    ;;
  restart)
    stop_app
    start_app
    ;;
  status)
    status_app
    ;;
  *)
    usage
    exit 2
    ;;
esac
