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
   * Loads the config file via Node's native dynamic `import()`: a `.ts` config is handled by
   * Node's built-in TypeScript type-stripping (Node >= 22.18, no build step needed); a `.js`
   * config loads directly. Extracts the default export, falling back to a named
   * `pristineConfig` export.
   */
  private async importConfigFile(absolutePath: string): Promise<PristineConfigFile> {
    let loaded: any;

    try {
      loaded = await this.dynamicImport(`file://${absolutePath}`);
    } catch (error) {
      throw this.describeImportError(error, absolutePath);
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

  /**
   * Translates Node's low-level module-loading failures for a `.ts` config into an
   * actionable error, distinguishing "this Node is too old / stripping disabled"
   * (`ERR_UNKNOWN_FILE_EXTENSION`) from "the config uses non-erasable TypeScript"
   * (`ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX`). Any other error passes through unchanged so
   * genuine config bugs surface as-is.
   */
  private describeImportError(error: any, absolutePath: string): Error {
    if (error?.code === "ERR_UNKNOWN_FILE_EXTENSION") {
      return new Error(
        `[pristine] Loading '${absolutePath}' requires Node >= 22.18 (native TypeScript ` +
        `type-stripping); you are running ${process.version}. Upgrade Node, or rename the ` +
        `file to 'pristine.config.js'.`,
      );
    }

    if (error?.code === "ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX") {
      return new Error(
        `[pristine] '${absolutePath}' uses TypeScript that Node cannot type-strip (enum, ` +
        `namespace, parameter properties, ...). Use only erasable TypeScript in your config, ` +
        `or rename the file to 'pristine.config.js'.\nOriginal error: ${error?.message ?? error}`,
      );
    }

    return error instanceof Error ? error : new Error(String(error));
  }
}
