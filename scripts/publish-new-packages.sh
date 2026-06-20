#!/usr/bin/env bash
#
# Bootstrap @pristine-ts packages onto the npm registry.
#
# Why this exists: master publishes via npm OIDC "trusted publishing" (the publish job in
# .github/workflows/build.yml has `id-token: write` and no NPM token). OIDC can publish new
# *versions* of packages that already exist, but it CANNOT create a brand-new package the
# first time. So when a new `@pristine-ts/*` package is added, CI's `lerna publish from-git`
# hits `E404 Not found`, aborts, and the whole master build goes red on every merge.
#
# The fix is a one-time, locally-run first publish (with an npm account that has create
# rights in the @pristine-ts scope). This script does exactly that, using
# `lerna publish from-package` -- which publishes only the packages whose local version is
# missing from the registry, rewrites `file:../*` deps to real semver ranges, and honours
# each package's `publishConfig.access: public`. After a package exists on npm, configure
# its trusted publisher on npmjs.com so future CI publishes (OIDC) succeed. See
# AGENTS.md > "Publishing & releasing".
#
# Usage:
#   scripts/publish-new-packages.sh            Build, then publish every registry-missing version.
#   scripts/publish-new-packages.sh --check    List packages missing from npm and exit
#                                              non-zero if any (no publishing). Usable as a
#                                              CI guard on PRs.
#
# Run from anywhere inside the repo. Publishing requires `npm login` (or NODE_AUTH_TOKEN)
# with permission to create packages in the @pristine-ts scope.
#
set -euo pipefail

usage() { echo "Usage: $(basename "$0") [--check]" >&2; exit 1; }

CHECK_ONLY=0
case "${1:-}" in
  --check|-c) CHECK_ONLY=1 ;;
  --help|-h)  usage ;;
  "")         ;;
  *)          echo "Unknown argument: $1" >&2; usage ;;
esac

# Resolve the repo root from the script's own location, so cwd doesn't matter.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Is the exact <name>@<version> already on the registry? 0 = present, 1 = missing.
# `npm view name@version version` prints the version if present, prints nothing if the
# package exists but lacks that version, and errors (E404) if the package doesn't exist.
version_on_npm() {
  local spec="$1" out
  out="$(npm view "$spec" version 2>/dev/null || true)"
  [ -n "$out" ]
}

echo "==> Scanning packages for versions missing from npm" >&2
MISSING=()
for pj in packages/*/package.json; do
  # Skip private packages (lerna never publishes them); read name + version.
  info="$(node -p "const p=require('$ROOT/$pj'); p.private ? '' : p.name + ' ' + p.version")"
  [ -n "$info" ] || continue
  name="${info% *}"; version="${info#* }"
  if version_on_npm "${name}@${version}"; then
    printf '    ok       %s@%s\n' "$name" "$version" >&2
  else
    printf '    MISSING  %s@%s\n' "$name" "$version" >&2
    MISSING+=("${name}@${version}")
  fi
done

if [ "${#MISSING[@]}" -eq 0 ]; then
  echo "==> All publishable packages are present on npm. Nothing to do." >&2
  exit 0
fi

echo "" >&2
echo "==> ${#MISSING[@]} package version(s) missing from npm:" >&2
printf '      %s\n' "${MISSING[@]}" >&2

if [ "$CHECK_ONLY" -eq 1 ]; then
  # Guard mode: signal "work needed" without publishing.
  exit 1
fi

# --- Publish mode -----------------------------------------------------------------------
echo "" >&2
if ! WHO="$(npm whoami 2>/dev/null)"; then
  cat >&2 <<'EOF'
Error: not authenticated to npm.
  Run `npm login` (or export NODE_AUTH_TOKEN) with an account that can CREATE packages in
  the @pristine-ts scope, then re-run this script.
EOF
  exit 1
fi
echo "==> Authenticated to npm as: $WHO" >&2

echo "==> Building all packages (root: npm run build)" >&2
npm run build

# `from-package` publishes exactly the packages whose local version is not yet on the
# registry -- the set listed above -- and skips everything already published. It does NOT
# version, tag, or push git; it only runs `npm publish` per package.
echo "==> Publishing missing versions (lerna publish from-package)" >&2
npx lerna publish from-package --yes

cat >&2 <<EOF

==> Done. Newly-created packages still need a trusted publisher for future CI releases.
    For each package that was created for the first time, on npmjs.com configure:
      Package > Settings > Trusted Publisher > GitHub Actions
        Repository:  magieno/pristine-ts
        Workflow:    .github/workflows/build.yml
    (Match the config of an already-working package such as @pristine-ts/core.)
    Until that is set, the next master publish will still E404 on these names.
EOF
