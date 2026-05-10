import fs from "fs";
import path from "path";

const CACHE_DIR = ".pristine";
const CACHE_FILE = "last-app-module";

/**
 * Reads the previously-selected AppModule path from `.pristine/last-app-module`. Returns
 * undefined if no cache exists or if the cached path no longer points to an existing file
 * (in which case the stale cache file is deleted so it doesn't keep being suggested).
 */
export const readCachedAppModulePath = (projectRoot: string): string | undefined => {
  const cachePath = path.resolve(projectRoot, CACHE_DIR, CACHE_FILE);
  if (fs.existsSync(cachePath) === false) {
    return undefined;
  }

  let cached: string;
  try {
    cached = fs.readFileSync(cachePath, "utf8").trim();
  } catch {
    return undefined;
  }

  if (cached.length === 0 || fs.existsSync(cached) === false) {
    // Stale cache — the user must have deleted or moved the file since they last selected it.
    try {
      fs.unlinkSync(cachePath);
    } catch {
      // Best-effort cleanup; if we can't delete it we still continue without using the cached value.
    }
    return undefined;
  }

  return cached;
}

/**
 * Persists the user's AppModule selection to `.pristine/last-app-module` so subsequent
 * `pristine` invocations in the same project skip the prompt. Best-effort: failures are
 * swallowed because the cache is an optimization, not correctness-critical.
 */
export const writeCachedAppModulePath = (projectRoot: string, absolutePath: string): void => {
  const cacheDir = path.resolve(projectRoot, CACHE_DIR);
  const cachePath = path.resolve(cacheDir, CACHE_FILE);

  try {
    fs.mkdirSync(cacheDir, {recursive: true});
    fs.writeFileSync(cachePath, absolutePath, "utf8");
  } catch {
    // Best-effort.
  }
}
