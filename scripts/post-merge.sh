#!/bin/bash
set -e
pnpm install --frozen-lockfile --ignore-scripts
# Rebuild native modules that require compilation
cd node_modules/.pnpm/better-sqlite3@12.10.0/node_modules/better-sqlite3 && node-gyp rebuild 2>&1 | tail -5
cd /home/runner/workspace
