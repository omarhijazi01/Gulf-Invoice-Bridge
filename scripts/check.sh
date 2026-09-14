#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
.venv/bin/ruff check backend scripts
.venv/bin/ruff format --check backend scripts
(cd backend && ../.venv/bin/python -m pytest -q)
(cd frontend && pnpm lint && pnpm typecheck && pnpm test && pnpm build)
