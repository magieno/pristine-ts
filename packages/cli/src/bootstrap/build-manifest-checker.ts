import {injectable} from "tsyringe";
import fs from "fs";
import path from "path";
import {BuildManifest} from "./build-manifest";
import {BuildManifestStalenessEnum} from "./build-manifest-staleness.enum";
import {SourceHasher} from "./source-hasher";

/**
 * Decides whether an existing `BuildManifest` still describes the current state of the
 * project. Compares the manifest's stored paths/hash against the live config + source file
 * + filesystem. Returns the most-specific reason the manifest is stale so the caller can
 * render a helpful message ("source changed", "output missing", etc.) rather than a vague
 * "stale".
 *
 * Order of checks matches user impact: things that mean "you definitely need to rebuild"
 * (output missing, source content changed) come before path drift (config edited but build
 * not yet rerun) — both are correct to flag, but the messaging differs.
 */
@injectable()
export class BuildManifestChecker {
  constructor(private readonly sourceHasher: SourceHasher) {
  }

  check(
    manifest: BuildManifest | undefined,
    projectRoot: string,
    configuredSourcePath: string,
    configuredOutputPath: string,
  ): BuildManifestStalenessEnum {
    if (manifest === undefined) {
      return BuildManifestStalenessEnum.Missing;
    }

    const absoluteConfiguredSource = path.resolve(projectRoot, configuredSourcePath);
    const absoluteConfiguredOutput = path.resolve(projectRoot, configuredOutputPath);

    // Manifest paths are stored relative to projectRoot (see BuildManifestWriter) so the
    // build is relocatable — resolve them against the *current* projectRoot before comparing.
    // path.resolve leaves an already-absolute path untouched, so manifests written by older
    // versions (which stored absolute paths) keep validating exactly as before.
    const manifestSource = path.resolve(projectRoot, manifest.appModuleSourcePath);
    const manifestOutput = path.resolve(projectRoot, manifest.appModuleOutputPath);

    if (manifestSource !== absoluteConfiguredSource) {
      return BuildManifestStalenessEnum.SourcePathChanged;
    }

    if (manifestOutput !== absoluteConfiguredOutput) {
      return BuildManifestStalenessEnum.OutputPathChanged;
    }

    if (fs.existsSync(manifestOutput) === false) {
      return BuildManifestStalenessEnum.OutputMissing;
    }

    if (fs.existsSync(manifestSource) === false) {
      // Source vanished — report as content-changed since "missing" is the extreme form.
      return BuildManifestStalenessEnum.SourceContentChanged;
    }

    const currentHash = this.sourceHasher.hashFile(manifestSource);
    if (currentHash !== manifest.sourceHash) {
      return BuildManifestStalenessEnum.SourceContentChanged;
    }

    return BuildManifestStalenessEnum.Fresh;
  }
}
