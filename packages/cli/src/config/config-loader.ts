import {injectable} from "tsyringe";
import fs from "fs";
import path from "path";
import {ConfigProvenanceEnum} from "./config-provenance.enum";
import {PristineConfig} from "./pristine-config.interface";
import {ResolvedPristineConfig} from "./resolved-pristine-config";
import {DynamicImporter} from "../bootstrap/dynamic-importer";

/**
 * Loads `pristine.config.ts` (preferred) or `pristine.config.js` (escape hatch for
 * pure-JS projects). Walks up from `process.cwd()` looking for the file, then loads it
 * through Node's native dynamic `import()`: TypeScript type-stripping (Node >= 22.18)
 * handles `.ts`, while `.js` loads directly.
 *
 * Returns a `ResolvedPristineConfig` carrying the file path (when found) and per-field
 * provenance, which `pristine p:config:print` uses to render an annotated dump.
 */
@injectable()
export class ConfigLoader {
  /**
   * File names searched for, in order. `.ts` is the canonical form — `defineConfig()`
   * gives full IDE autocomplete and every Pristine project ships a TS toolchain anyway.
   * `.js` is the escape hatch for the rare pure-JS project that cannot have a `.ts`
   * file at the root.
   */
  private readonly configFileNames: ReadonlyArray<string> = [
    "pristine.config.ts",
    "pristine.config.js",
  ];

  constructor(private readonly dynamicImporter: DynamicImporter) {
  }

  async load(options?: {explicitPath?: string; startDir?: string}): Promise<ResolvedPristineConfig> {
    const startDir = options?.startDir ?? process.cwd();

    let configFilePath: string | undefined;
    if (options?.explicitPath !== undefined) {
      const abs = path.resolve(startDir, options.explicitPath);
      if (fs.existsSync(abs) === false) {
        throw new Error(`[pristine] Config file not found: '${options.explicitPath}' (resolved to '${abs}')`);
      }
      configFilePath = abs;
    } else {
      configFilePath = this.findConfigFile(startDir);
    }

    if (configFilePath === undefined) {
      return new ResolvedPristineConfig({}, undefined, {});
    }

    const config = await this.importConfigFile(configFilePath);
    const provenance: Record<string, ConfigProvenanceEnum> = {};
    for (const key of Object.keys(config)) {
      provenance[key] = ConfigProvenanceEnum.ConfigFile;
    }

    return new ResolvedPristineConfig(config, configFilePath, provenance);
  }

  /**
   * Walks up from `startDir` looking for a config file with any of the supported names.
   * Stops at the first match, returning the absolute path. Stops at the filesystem root
   * without finding anything → returns undefined. Walking up matters in monorepos: a CLI
   * invoked in `packages/foo/` should still find a `pristine.config.ts` at the repo root.
   * @private
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
   * Loads a config file from `absolutePath` via Node's native dynamic `import()`. A `.ts`
   * config is handled by Node's built-in TypeScript type-stripping (Node >= 22.18); a `.js`
   * config loads directly. Extracts the default export, falling back to a named
   * `pristineConfig` export for users who prefer not to use `export default`.
   * @private
   */
  private async importConfigFile(absolutePath: string): Promise<PristineConfig> {
    let loaded: any;

    try {
      loaded = await this.dynamicImporter.import(`file://${absolutePath}`);
    } catch (error) {
      throw this.describeImportError(error, absolutePath);
    }

    const config = loaded?.default ?? loaded?.pristineConfig ?? loaded;

    if (!config || typeof config !== "object") {
      throw new Error(
        `[pristine] Config file at '${absolutePath}' did not export a valid configuration. ` +
        `Use \`export default defineConfig({ ... })\` or \`export const pristineConfig = { ... }\`.`,
      );
    }

    return config as PristineConfig;
  }

  /**
   * Translates Node's low-level module-loading failures for a `.ts` config into an
   * actionable error. Native type-stripping has two distinct failure modes worth telling
   * apart: the running Node is too old (or has stripping disabled) to import `.ts` at all
   * (`ERR_UNKNOWN_FILE_EXTENSION`), versus a config written with non-erasable TypeScript that
   * stripping refuses (`ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX`). Any other error is passed through
   * unchanged so genuine config bugs surface as-is.
   * @private
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
