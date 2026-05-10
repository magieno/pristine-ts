#!/bin/bash

# Installs dependencies in every monorepo package and every test harness. Test harnesses
# (tests/cli, tests/e2e, tests/perf) are standalone npm projects that aren't covered by lerna,
# so without this loop their node_modules end up empty and `npm run e2e` / `npm run test:cli`
# fail at module-resolution time.
for dir in packages/* tests/*; do
  if [ -d "$dir" ] && [ -f "$dir/package.json" ]; then
    echo "Installing dependencies in $dir"
    (cd "$dir" && npm install)
  fi
done
