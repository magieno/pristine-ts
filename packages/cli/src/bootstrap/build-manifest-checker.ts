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

    if (manifest.appModuleSourcePath !== absoluteConfiguredSource) {
      return BuildManifestStalenessEnum.SourcePathChanged;
    }

    if (manifest.appModuleOutputPath !== absoluteConfiguredOutput) {
      return BuildManifestStalenessEnum.OutputPathChanged;
    }

    if (fs.existsSync(manifest.appModuleOutputPath) === false) {
      return BuildManifestStalenessEnum.OutputMissing;
    }

    if (fs.existsSync(manifest.appModuleSourcePath) === false) {
      // Source vanished — report as content-changed since "missing" is the extreme form.
      return BuildManifestStalenessEnum.SourceContentChanged;
    }

    const currentHash = this.sourceHasher.hashFile(manifest.appModuleSourcePath);
    if (currentHash !== manifest.sourceHash) {
      return BuildManifestStalenessEnum.SourceContentChanged;
    }

    return BuildManifestStalenessEnum.Fresh;
  }
}
