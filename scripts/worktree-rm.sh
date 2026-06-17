#!/usr/bin/env bash
#
# Remove a worktree created by worktree-new.sh.
#
# Usage: scripts/worktree-rm.sh <task-name> [--force] [--delete-branch]
#   --force          Remove even if the worktree has uncommitted changes.
#   --delete-branch  Also delete the branch named <task-name>.
#
# Deletes only the worktree directory. The master checkout is never touched.
#
set -euo pipefail

usage() { echo "Usage: $(basename "$0") <task-name> [--force] [--delete-branch]" >&2; exit 1; }

TASK="${1:-}"
[ -n "$TASK" ] || usage
shift

FORCE=""
DELETE_BRANCH=0
for arg in "$@"; do
  case "$arg" in
    --force) FORCE="--force" ;;
    --delete-branch) DELETE_BRANCH=1 ;;
    *) echo "Unknown option: $arg" >&2; usage ;;
  esac
done

# Resolve the master checkout + container the same way worktree-new.sh does.
GIT_COMMON_DIR="$(git rev-parse --git-common-dir)"
MAIN_REPO="$(cd "$GIT_COMMON_DIR/.." && pwd)"
CONTAINER="$(cd "$(dirname "$MAIN_REPO")" && pwd)"
# Match worktree-new.sh: the dir name flattens "/" to "-" (the branch keeps its real name).
SLUG="${TASK//\//-}"
DEST="$CONTAINER/$SLUG"

echo "==> Removing worktree $DEST"
git -C "$MAIN_REPO" worktree remove $FORCE "$DEST"

if [ "$DELETE_BRANCH" -eq 1 ]; then
  echo "==> Deleting branch $TASK"
  git -C "$MAIN_REPO" branch -D "$TASK"
fi

echo "==> Done. The master checkout is untouched."
