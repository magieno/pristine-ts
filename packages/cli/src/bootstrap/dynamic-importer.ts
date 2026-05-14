import {injectable} from "tsyringe";

/**
 * Wraps Node's real dynamic `import()` so it survives both tsc's CJS lowering and esbuild's
 * bundling. Both transformations otherwise rewrite `await import(x)` to a `require(x)` call —
 * which is wrong for ESM-only packages and for `file://` URLs. The Function constructor's body
 * is opaque to both, so the `import()` inside it goes through unrewritten.
 *
 * Centralized in one class so the same escape hatch isn't reimplemented in every consumer
 * (loaders, plugin discovery, config loading, etc.).
 */
@injectable()
export class DynamicImporter {
  private readonly importFn: (specifier: string) => Promise<any> = new Function(
    "specifier",
    "return import(specifier);",
  ) as (specifier: string) => Promise<any>;

  async import(specifier: string): Promise<any> {
    return this.importFn(specifier);
  }
}
