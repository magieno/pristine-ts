import {injectable} from "tsyringe";
import fs from "fs";
import path from "path";

/**
 * Persists the user's selection from the disambiguation prompt so subsequent invocations of
 * `pristine` in the same project skip the prompt. Stale entries (target file deleted since
 * the cache was written) are auto-cleaned on read.
 *
 * Best-effort throughout — failures to read or write the cache file are swallowed because
 * the cache is a UX optimization, not correctness-critical.
 */
@injectable()
export class AppModuleCache {
  private readonly cacheDirName: string = ".pristine";
  private readonly cacheFileName: string = "last-app-module";

  read(projectRoot: string): string | undefined {
    const cachePath = this.cachePath(projectRoot);
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
      // Stale cache — the user must have deleted or moved the file. Drop it so it doesn't
      // keep being suggested on every subsequent invocation.
      try {
        fs.unlinkSync(cachePath);
      } catch {
        // Best-effort cleanup.
      }
      return undefined;
    }

    return cached;
  }

  write(projectRoot: string, absolutePath: string): void {
    try {
      fs.mkdirSync(path.resolve(projectRoot, this.cacheDirName), {recursive: true});
      fs.writeFileSync(this.cachePath(projectRoot), absolutePath, "utf8");
    } catch {
      // Best-effort.
    }
  }

  private cachePath(projectRoot: string): string {
    return path.resolve(projectRoot, this.cacheDirName, this.cacheFileName);
  }
}
