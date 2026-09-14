#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ -f .env ]]; then set -a; source .env; set +a; fi
if [[ ! -x .venv/bin/python ]]; then
  echo 'Create .venv and install backend/requirements-dev.txt first. See README.'
  exit 1
fi
if ! command -v node >/dev/null; then
  bundled_node="/home/omar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin"
  if [[ -x "$bundled_node/node" ]]; then export PATH="$bundled_node:$PATH"; fi
fi
pids=()
cleanup() { for pid in "${pids[@]}"; do kill "$pid" 2>/dev/null || true; done; }
trap cleanup EXIT INT TERM
.venv/bin/uvicorn app.erp.main:app --app-dir backend --host 127.0.0.1 --port 8001 &
pids+=("$!")
.venv/bin/uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 &
pids+=("$!")
(cd frontend && node node_modules/vite/bin/vite.js --host 127.0.0.1) &
pids+=("$!")
echo 'Frontend: http://127.0.0.1:5173 | API docs: http://127.0.0.1:8000/docs'
wait -n "${pids[@]}"
