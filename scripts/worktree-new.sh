#!/usr/bin/env bash
#
# Create a fully-provisioned git worktree for a parallel agent/task.
#
# Usage: scripts/worktree-new.sh <task-name> [base-branch]
#   <task-name>    Worktree dir + new branch name (e.g. "improve-logging"). A "/" in the
#                  name is flattened to "-" for the directory (feature/x -> feature-x).
#   [base-branch]  Branch to fork from. Defaults to "master".
#
# Layout (container): the worktree is a flat sibling of the master checkout --
#   <container>/<task-name>      e.g. .../pristine-ts/improve-logging
# next to .../pristine-ts/master. See AGENTS.md > "Parallel git worktrees".
#
# Provisioning: each worktree gets isolated dependencies -- `npm ci` runs in every dir
# that has a package.json + package-lock.json (root first, so the root's file:packages/*
# links resolve before the per-package installs). Nothing else is shared from master:
# pristine-ts has no data dir, docker stack, or local .env to link.
#
# Run from anywhere inside the repo (master/ or any existing worktree).
#
set -euo pipefail

usage() { echo "Usage: $(basename "$0") <task-name> [base-branch]" >&2; exit 1; }

TASK="${1:-}"
BASE="${2:-master}"
[ -n "$TASK" ] || usage

if [ "$TASK" = "master" ]; then
  echo "Error: 'master' is reserved for the primary checkout. Pick another task name." >&2
  exit 1
fi

# Resolve the master checkout (owns the real .git) and its container, from any worktree.
# git rev-parse --git-common-dir always points at the main worktree's .git.
GIT_COMMON_DIR="$(git rev-parse --git-common-dir)"
MAIN_REPO="$(cd "$GIT_COMMON_DIR/.." && pwd)"
CONTAINER="$(cd "$(dirname "$MAIN_REPO")" && pwd)"

# Keep the real branch name, but flatten "/" so feature/x -> dir feature-x.
BRANCH="$TASK"
SLUG="${TASK//\//-}"
DEST="$CONTAINER/$SLUG"

[ -e "$DEST" ] && { echo "Error: $DEST already exists." >&2; exit 1; }
if git -C "$MAIN_REPO" show-ref --verify --quiet "refs/heads/$BRANCH"; then
  echo "Error: branch '$BRANCH' already exists. Pick another name or delete it first." >&2
  exit 1
fi

echo "==> Creating worktree $DEST (branch '$BRANCH' off '$BASE')"
git -C "$MAIN_REPO" worktree add -b "$BRANCH" "$DEST" "$BASE"

echo "==> Installing dependencies (isolated per worktree; root first)"
# `npm ci` honours the committed lockfile; if a lockfile has drifted out of sync we fall
# back to `npm install` rather than aborting the whole provision.
find "$DEST" -name package-lock.json -not -path '*/node_modules/*' -not -path '*/dist/*' -print0 \
  | xargs -0 -n1 dirname \
  | awk '{ print length, $0 }' | sort -n | cut -d' ' -f2- \
  | while IFS= read -r dir; do
      rel="${dir#"$DEST"/}"; [ "$dir" = "$DEST" ] && rel="."
      echo "    npm ci  $rel"
      if ! ( cd "$dir" && npm ci --no-audit --no-fund ); then
        echo "    (lockfile out of sync -- falling back to npm install in $rel)"
        ( cd "$dir" && npm install --no-audit --no-fund )
      fi
    done

cat <<EOF

==> Worktree ready: $DEST
    Branch: $BRANCH (off $BASE)
    Build:  ( cd "$DEST" && npm run build )
EOF
