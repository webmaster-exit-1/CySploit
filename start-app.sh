#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

export DATABASE_URL="${DATABASE_URL:-postgresql://cysploit:cysploit@localhost:5432/cysploit}"
export PORT="${PORT:-5000}"

exec npx electron electron/main.js
