/**
 * Why a build manifest is no longer trustworthy. Returned by `BuildManifestChecker` so the
 * caller can render an error message specific to the actual cause rather than a vague "stale".
 */
export enum BuildManifestStalenessEnum {
  /** Manifest is current — the build output matches what the config + source describe. */
  Fresh = "fresh",
  /** No manifest file on disk. The user hasn't run `pristine build` yet (or deleted the cache). */
  Missing = "missing",
  /** The configured `sourcePath` no longer matches the path stored in the manifest. */
  SourcePathChanged = "source-path-changed",
  /** The configured `outputPath` no longer matches the path stored in the manifest. */
  OutputPathChanged = "output-path-changed",
  /** The source file's content hash no longer matches what was hashed at build time. */
  SourceContentChanged = "source-content-changed",
  /** The compiled output file referenced by the manifest is missing from disk. */
  OutputMissing = "output-missing",
}
