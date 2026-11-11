#!/usr/bin/env bash
# Run from apps/web BEFORE every push. Reproduces exactly what Vercel does.
set -euo pipefail
echo "1/3 lockfile in sync?"; pnpm install --frozen-lockfile
echo "2/3 strict type check";  pnpm exec tsc --noEmit
echo "3/3 production build";   pnpm build
echo "OK: safe to push"
