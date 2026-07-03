import fs from "fs";
import path from "path";
import {injectable} from "tsyringe";

/**
 * Reads `@pristine-ts/cli`'s own `package.json` — used by `pristine info` to report the version
 * of the CLI that is actually running (not whatever happens to live in the consumer's project
 * root). Every operation is **lazy** (nothing touches the filesystem or a module-location global
 * until {@link readVersion} is called) and **ESM-safe** in every build/bundle shape.
 *
 * ## Why `__dirname` (guarded) and not `import.meta.url`
 *
 * The obvious "modern" answer is `path.dirname(fileURLToPath(import.meta.url))`, but it does not
 * survive this package's dual (CJS + ESM) build:
 *
 * - A literal `import.meta` is a **syntax error** the instant Node loads a file as CommonJS
 *   (`SyntaxError: Cannot use 'import.meta' outside a module`) — not a runtime `ReferenceError`
 *   a guard could dodge, and unreachable via `eval`/`new Function` (script scope). So it can
 *   never appear in any source compiled into the CommonJS `main` build, or
 *   `require("@pristine-ts/cli")` would throw at load. (This resolver is compiled into both
 *   builds.)
 * - It would not even help the case it is meant to: the only situation where `__dirname` is
 *   absent is when a consumer **bundles** the CLI into an ESM output (e.g. rollup
 *   `format: 'esm'`) — exactly the crash this class exists to prevent. In a bundle the code has
 *   been moved away from `dist/lib/.../package.json`, so `import.meta.url` there points at the
 *   bundle, not the package, and the read fails anyway. (A native-ESM consumer that does *not*
 *   bundle still loads the CLI through its CommonJS `main`, where `__dirname` is present.)
 *
 * So the correct, portable design is: read `__dirname` when present (the `pristine` bin and every
 * normal Node process), guard it with `typeof` so a bare reference never throws in an ESM
 * context, and degrade to `"unknown"` when the `package.json` genuinely cannot be located.
 *
 * Kept as an `@injectable()` service (per the project's OO-utility convention) so it can be
 * constructor-injected like any other dependency and faked in tests.
 */
@injectable()
export class CliPackageJsonResolver {
  /**
   * Returns the running CLI's version, or `"unknown"` if it cannot be determined. Never throws —
   * a diagnostic command must not brick the process just because it could not locate its own
   * `package.json`.
   */
  readVersion(): string {
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
   * build or a consumer bundle that only shims `require` — the crash this class exists to prevent.
   *
   * `protected` so tests can force the ESM (no-`__dirname`) path: under ts-jest (which compiles to
   * CommonJS) `__dirname` is always defined, so overriding this is the only way to exercise the
   * degrade-to-`"unknown"` branch.
   */
  protected getCommonJsDirectory(): string | undefined {
    return typeof __dirname !== "undefined" ? __dirname : undefined;
  }
}
