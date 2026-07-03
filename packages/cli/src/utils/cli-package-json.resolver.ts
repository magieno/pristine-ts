import fs from "fs";
import path from "path";
import {injectable} from "tsyringe";
import {CLI_VERSION} from "../generated/version";

/**
 * Reports `@pristine-ts/cli`'s own version — used by `pristine info` to show the version of the
 * CLI that is actually running (not whatever happens to live in the consumer's project root).
 *
 * ## Primary source: a build-time constant
 *
 * The version comes from {@link CLI_VERSION}, a constant generated from `package.json` at build
 * time (`scripts/generate-version.mjs`, run on `prebuild`/`pretest`). A baked-in constant is the
 * only approach that reports the right version **identically in CommonJS, native ESM, and bundled
 * ESM** — it needs no filesystem read, no `__dirname`, and no `import.meta`.
 *
 * ## Why not runtime path resolution
 *
 * Reading `package.json` off disk at runtime cannot work once a consumer **bundles** the CLI into
 * an ESM output (e.g. rollup `format: 'esm'`): the code has been moved away from
 * `dist/lib/.../package.json`, so any location primitive is wrong there —
 * - `__dirname` is a CommonJS-only global (absent in the bundle → `ReferenceError` unless guarded),
 * - `import.meta.url` points at the bundle, not the package (and a literal `import.meta` is a
 *   syntax error the instant a file loads as CommonJS, so it can't even live in this dual-build
 *   source).
 *
 * The filesystem read is therefore kept only as a **fallback** for the theoretical case where the
 * generated constant is somehow absent; it is `__dirname`-guarded and degrades to `"unknown"`
 * rather than throwing. In practice the constant is always present, so `pristine info` no longer
 * degrades to `"unknown"` in bundled ESM.
 *
 * Kept as an `@injectable()` service (per the project's OO-utility convention) so it can be
 * constructor-injected like any other dependency and faked in tests.
 */
@injectable()
export class CliPackageJsonResolver {
  /**
   * Returns the running CLI's version, or `"unknown"` if it genuinely cannot be determined. Never
   * throws — a diagnostic command must not brick the process just because it could not read its
   * own version.
   */
  readVersion(): string {
    const generated = this.readVersionFromConstant();
    if (generated !== undefined) {
      return generated;
    }
    return this.readVersionFromPackageJson();
  }

  /**
   * The build-time constant, or `undefined` if it is missing/blank/placeholder so the caller falls
   * back to the filesystem read.
   *
   * `protected` so tests can force the filesystem-fallback path by overriding it to return
   * `undefined` — the generated constant is otherwise always present.
   */
  protected readVersionFromConstant(): string | undefined {
    return typeof CLI_VERSION === "string" && CLI_VERSION.length > 0 && CLI_VERSION !== "unknown"
      ? CLI_VERSION
      : undefined;
  }

  /**
   * Fallback: read the version out of the CLI's `package.json` on disk. `__dirname`-guarded and
   * non-throwing — returns `"unknown"` when the file cannot be located or parsed (e.g. an ESM
   * bundle with no `__dirname` in scope).
   */
  private readVersionFromPackageJson(): string {
    try {
      const packageJsonPath = this.resolvePackageJsonPath();
      if (packageJsonPath === undefined) {
        return "unknown";
      }
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
      return pkg.version ?? "unknown";
    } catch {
      return "unknown";
    }
  }

  /**
   * Resolves the absolute path to the CLI's `package.json`, or `undefined` when the module
   * directory cannot be determined (an ESM bundle with no `__dirname` in scope).
   */
  private resolvePackageJsonPath(): string | undefined {
    const baseDirectory = this.getCommonJsDirectory();
    if (baseDirectory === undefined) {
      return undefined;
    }
    // The compiled resolver sits at dist/lib/{cjs,esm}/utils/, four levels below the package root.
    return path.resolve(baseDirectory, "..", "..", "..", "..", "package.json");
  }

  /**
   * Reads the CommonJS `__dirname` global, or `undefined` in an ESM context. The `typeof` guard
   * keeps a bare reference from throwing `ReferenceError: __dirname is not defined` in the raw ESM
   * build or a consumer bundle that only shims `require`.
   *
   * `protected` so tests can force the fallback's ESM (no-`__dirname`) path: under ts-jest (which
   * compiles to CommonJS) `__dirname` is always defined, so overriding this is the only way to
   * exercise the degrade-to-`"unknown"` branch.
   */
  protected getCommonJsDirectory(): string | undefined {
    return typeof __dirname !== "undefined" ? __dirname : undefined;
  }
}
