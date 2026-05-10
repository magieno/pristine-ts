import fs from "fs";
import path from "path";

/**
 * A plausible AppModule candidate found by the convention-based scan. `score` is used to
 * rank candidates: lower scores beat higher ones. Same score = ambiguous, prompt.
 */
export interface AppModuleCandidate {
  absolutePath: string;
  // Path relative to the project root (process.cwd()). Used for display.
  displayPath: string;
  // Lower = better. Files literally named app.module.{js,mjs,cjs} get score 0;
  // other *.module.{js,mjs,cjs} files that export "AppModule" get score 10.
  score: number;
  // Why this file matched: "named" (file is app.module.*) or "exports" (exports an AppModule symbol).
  reason: "named" | "exports";
}

/**
 * Search roots scanned for AppModule candidates, relative to project root. Order is intentional:
 * compiled output first (more likely to be the runtime entry), then build/, then the project root
 * itself for trivial cases (a single-file demo with everything at the root).
 */
const SEARCH_ROOTS: string[] = [
  "dist",
  "dist/lib/cjs",
  "dist/lib/esm",
  "build",
  ".",
];

const MODULE_FILE_REGEX = /^[A-Za-z0-9._-]+\.module\.(js|mjs|cjs)$/;
const APP_MODULE_NAME_REGEX = /^app\.module\.(js|mjs|cjs)$/i;

/**
 * Scans well-known directories for files that look like AppModule definitions and returns
 * a deduplicated, ranked list of candidates. A file is considered a candidate when:
 *   - its name matches `*.module.{js,mjs,cjs}` (and isn't a test/spec file), AND
 *   - either the filename literally matches `app.module.{js,mjs,cjs}` (highest confidence),
 *     OR the module's exports include a symbol named `AppModule`.
 *
 * The function is non-recursive (each search root is scanned at depth 1 only) so it stays
 * fast on large repos and predictable when users have lots of nested module files.
 *
 * @param projectRoot Absolute path to the user's project root (typically `process.cwd()`).
 */
export const discoverAppModuleCandidates = async (projectRoot: string): Promise<AppModuleCandidate[]> => {
  const seen = new Set<string>();
  const candidates: AppModuleCandidate[] = [];

  for (const root of SEARCH_ROOTS) {
    const dir = path.resolve(projectRoot, root);
    if (fs.existsSync(dir) === false || fs.statSync(dir).isDirectory() === false) {
      continue;
    }

    const entries = fs.readdirSync(dir, {withFileTypes: true});
    for (const entry of entries) {
      if (entry.isFile() === false) {
        continue;
      }
      if (MODULE_FILE_REGEX.test(entry.name) === false) {
        continue;
      }
      if (entry.name.includes(".spec.") || entry.name.includes(".test.")) {
        continue;
      }

      const absolutePath = path.resolve(dir, entry.name);
      // Same physical file (e.g. dist/app.module.js and dist/lib/cjs/app.module.js pointing at
      // duplicated builds) — keep the first occurrence (which respects SEARCH_ROOTS order).
      if (seen.has(absolutePath)) {
        continue;
      }
      seen.add(absolutePath);

      const displayPath = path.relative(projectRoot, absolutePath);

      if (APP_MODULE_NAME_REGEX.test(entry.name)) {
        candidates.push({absolutePath, displayPath, score: 0, reason: "named"});
        continue;
      }

      // Filename doesn't say "app.module" — check whether the module exports an `AppModule`
      // symbol. We require() rather than import() because (a) the only files we accept here
      // are .js/.mjs/.cjs whose CJS variants load synchronously, and (b) a synchronous probe
      // avoids holding open import() promises for files we may discard.
      let exportsAppModule = false;
      try {
        const loaded = require(absolutePath);
        exportsAppModule = loaded && typeof loaded === "object" && "AppModule" in loaded;
      } catch {
        // Treat unreadable / unloadable files as non-candidates — they cannot be the AppModule
        // even if they were intended to be, because the loader couldn't open them either.
      }

      if (exportsAppModule) {
        candidates.push({absolutePath, displayPath, score: 10, reason: "exports"});
      }
    }
  }

  // Sort by score asc, then by displayPath for deterministic ordering within a score bucket.
  candidates.sort((a, b) => {
    if (a.score !== b.score) {
      return a.score - b.score;
    }
    return a.displayPath.localeCompare(b.displayPath);
  });

  return candidates;
}
