import {injectable} from "tsyringe";
import fs from "fs";
import path from "path";
import {PristineConfigFile} from "./pristine-config-file.interface";

/**
 * Locates and dynamically imports `pristine.config.{ts,js}`. Lives in
 * `@pristine-ts/configuration` so both the configuration manager (reads the `config:`
 * block during kernel boot) and the CLI bootstrap (reads the `cli:` block before the
 * kernel exists) share one walker, one importer, and one cache — avoiding drift between
 * two separate readers seeing different files.
 *
 * **Memoized per absolute path**: once a config file is found at a given path, the
 * parsed object is cached for the process lifetime. Repeated calls from different parts
 * of the codebase (configuration manager, CLI bootstrap, plugin loader) parse the file
 * exactly once.
 *
 * **Optional**: if no file is found, `load()` returns `undefined`. Callers degrade
 * gracefully — the configuration manager falls back to its other resolution sources, the
 * CLI falls back to a `CliModule`-only AppModule.
 */
@injectable()
export class PristineConfigFileLoader {
  private readonly configFileNames: ReadonlyArray<string> = [
    "pristine.config.ts",
    "pristine.config.js",
  ];

  private readonly cache = new Map<string, PristineConfigFile>();

  /**
   * Wraps Node's real dynamic `import()` so it survives both tsc's CJS lowering and
   * esbuild's bundling. Both otherwise rewrite `await import(x)` into `require(x)`, which
   * fails for ESM-only packages and `file://` URLs. The Function constructor's body is
   * opaque to those transforms, so the `import()` inside it goes through unrewritten.
   */
  private readonly dynamicImport: (specifier: string) => Promise<any> = new Function(
    "specifier",
    "return import(specifier);",
  ) as (specifier: string) => Promise<any>;

  /**
   * Finds the nearest `pristine.config.{ts,js}` walking up from `startDir` (defaults to
   * `process.cwd()`), dynamic-imports it, and returns the parsed object. Returns
   * `undefined` when no file is found anywhere up the directory tree — callers must
   * treat absence as "no overrides," not as an error.
   */
  public async load(startDir: string = process.cwd()): Promise<PristineConfigFile | undefined> {
    const filePath = this.findConfigFile(startDir);
    if (filePath === undefined) {
      return undefined;
    }

    const cached = this.cache.get(filePath);
    if (cached !== undefined) {
      return cached;
    }

    const parsed = await this.importConfigFile(filePath);
    this.cache.set(filePath, parsed);
    return parsed;
  }

  /**
   * Walks up from `startDir` looking for any of the supported config file names. Stops at
   * the first match. Walking up matters in monorepos: a tool invoked in `packages/foo/`
   * should still find a `pristine.config.ts` at the repo root.
   */
  private findConfigFile(startDir: string): string | undefined {
    let current = path.resolve(startDir);

    while (true) {
      for (const name of this.configFileNames) {
        const candidate = path.join(current, name);
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
          return candidate;
        }
      }
      const parent = path.dirname(current);
      // path.dirname of root === root; we've hit the filesystem boundary.
      if (parent === current) return undefined;
      current = parent;
    }
  }

  /**
   * Loads the config file via the appropriate mechanism for its extension: jiti for `.ts`
   * (in-process TS transform with no build step needed), native dynamic import for `.js`.
   * Extracts the default export, falling back to a named `pristineConfig` export.
   */
  private async importConfigFile(absolutePath: string): Promise<PristineConfigFile> {
    const ext = path.extname(absolutePath).toLowerCase();
    let loaded: any;

    if (ext === ".ts") {
      const jitiModule = await this.dynamicImport("jiti");
      const createJiti = jitiModule.default ?? jitiModule.createJiti ?? jitiModule;
      const jiti = createJiti(absolutePath, {interopDefault: true});
      loaded = jiti(absolutePath);
    } else {
      loaded = await this.dynamicImport(`file://${absolutePath}`);
    }

    const parsed = loaded?.default ?? loaded?.pristineConfig ?? loaded;

    if (!parsed || typeof parsed !== "object") {
      throw new Error(
        `[pristine] Config file at '${absolutePath}' did not export a valid configuration. ` +
        `Use \`export default defineConfig({ ... })\` or \`export const pristineConfig = { ... }\`.`,
      );
    }

    return parsed as PristineConfigFile;
  }
}
