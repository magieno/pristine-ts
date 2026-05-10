import {injectable} from "tsyringe";
import fs from "fs";
import path from "path";
import {AppModuleDiscoveryCandidate} from "./app-module-discovery-candidate";
import {AppModuleDiscoveryReasonEnum} from "./app-module-discovery-reason.enum";

/**
 * Scans well-known directories for files that look like AppModule definitions. Non-recursive
 * (each search root is scanned at depth 1 only) so it stays fast on large repos and predictable
 * when users have many nested module files.
 *
 * A file is a candidate when:
 *   - its filename matches `*.module.{js,mjs,cjs}` (and is not a test/spec file), AND
 *   - either the filename literally matches `app.module.{js,mjs,cjs}` (highest confidence,
 *     scored 0), OR the file's exports include a symbol named `AppModule` (scored 10).
 */
@injectable()
export class AppModuleDiscoverer {
  /**
   * Search roots scanned for candidates, relative to the project root. Order is intentional:
   * compiled output first (most likely runtime entry), then build/, then the project root
   * itself for trivial single-file demos.
   */
  private readonly searchRoots: ReadonlyArray<string> = [
    "dist",
    "dist/lib/cjs",
    "dist/lib/esm",
    "build",
    ".",
  ];

  private readonly moduleFileRegex = /^[A-Za-z0-9._-]+\.module\.(js|mjs|cjs)$/;
  private readonly appModuleNameRegex = /^app\.module\.(js|mjs|cjs)$/i;

  async discover(projectRoot: string): Promise<AppModuleDiscoveryCandidate[]> {
    const seen = new Set<string>();
    const candidates: AppModuleDiscoveryCandidate[] = [];

    for (const root of this.searchRoots) {
      const dir = path.resolve(projectRoot, root);
      if (fs.existsSync(dir) === false || fs.statSync(dir).isDirectory() === false) {
        continue;
      }

      const entries = fs.readdirSync(dir, {withFileTypes: true});
      for (const entry of entries) {
        if (entry.isFile() === false) continue;
        if (this.moduleFileRegex.test(entry.name) === false) continue;
        if (entry.name.includes(".spec.") || entry.name.includes(".test.")) continue;

        const absolutePath = path.resolve(dir, entry.name);
        // Same physical file (e.g. dist/app.module.js and dist/lib/cjs/app.module.js pointing
        // at duplicated builds) — keep the first occurrence (which respects searchRoots order).
        if (seen.has(absolutePath)) continue;
        seen.add(absolutePath);

        const displayPath = path.relative(projectRoot, absolutePath);

        if (this.appModuleNameRegex.test(entry.name)) {
          candidates.push(new AppModuleDiscoveryCandidate(absolutePath, displayPath, 0, AppModuleDiscoveryReasonEnum.Named));
          continue;
        }

        if (this.exportsAppModule(absolutePath)) {
          candidates.push(new AppModuleDiscoveryCandidate(absolutePath, displayPath, 10, AppModuleDiscoveryReasonEnum.Exports));
        }
      }
    }

    candidates.sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      return a.displayPath.localeCompare(b.displayPath);
    });

    return candidates;
  }

  /**
   * Synchronous probe: does this file's exports include an `AppModule` symbol? Uses
   * `require()` rather than dynamic `import()` because (a) we only accept `.js/.mjs/.cjs`
   * whose CJS variants load synchronously, and (b) discarded probes shouldn't hold open
   * `import()` promises.
   * @private
   */
  private exportsAppModule(absolutePath: string): boolean {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const loaded = require(absolutePath);
      return loaded !== null && typeof loaded === "object" && "AppModule" in loaded;
    } catch {
      // Treat unreadable / unloadable files as non-candidates — the loader couldn't open them
      // either, so they cannot be the AppModule.
      return false;
    }
  }
}
