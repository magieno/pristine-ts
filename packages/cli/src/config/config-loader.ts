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
 * through `jiti` (for `.ts`) or Node's dynamic `import()` (for `.js`).
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
   * Loads a config file from `absolutePath`. `.ts` goes through `jiti`; `.js` uses Node's
   * native dynamic `import()`. Extracts the default export, falling back to a named
   * `pristineConfig` export for users who prefer not to use `export default`.
   * @private
   */
  private async importConfigFile(absolutePath: string): Promise<PristineConfig> {
    const ext = path.extname(absolutePath).toLowerCase();
    let loaded: any;

    if (ext === ".ts") {
      const jitiModule = await this.dynamicImporter.import("jiti");
      const createJiti = jitiModule.default ?? jitiModule.createJiti ?? jitiModule;
      const jiti = createJiti(absolutePath, {interopDefault: true});
      loaded = jiti(absolutePath);
    } else {
      loaded = await this.dynamicImporter.import(`file://${absolutePath}`);
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
}
