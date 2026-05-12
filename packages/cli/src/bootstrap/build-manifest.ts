/**
 * On-disk record of what `pristine build` produced. Written atomically at the end of a
 * successful build to `.pristine/build-manifest.json`. Read by every downstream command that
 * loads the AppModule (`pristine start`, `pristine verify`, etc.) so the loader can detect
 * staleness — source file changed, config changed, output file missing — without scanning
 * the filesystem.
 *
 * Plain class (no DI / no methods) because manifests serialize to/from JSON and the simpler
 * the shape is, the harder it is to break the on-disk contract by accident.
 */
export class BuildManifest {
  constructor(
    /** Absolute path to the AppModule source file as it was at build time. */
    public readonly appModuleSourcePath: string,
    /** Absolute path to the compiled AppModule output file as it was at build time. */
    public readonly appModuleOutputPath: string,
    /** SHA-256 of the source file contents at build time. Drives staleness detection. */
    public readonly sourceHash: string,
    /** ISO-8601 timestamp of when the build completed. */
    public readonly builtAt: string,
  ) {
  }
}
