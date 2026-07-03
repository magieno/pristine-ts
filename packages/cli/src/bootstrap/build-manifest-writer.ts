import {injectable} from "tsyringe";
import fs from "fs";
import path from "path";
import {BuildManifest} from "./build-manifest";
import {SourceHasher} from "./source-hasher";

/**
 * Writes the build manifest to `<projectRoot>/.pristine/build-manifest.json` atomically
 * (write-then-rename) so a partial write can never poison subsequent reads. Used by
 * `BuildCommand` after a successful compile.
 *
 * Atomicity matters: if `pristine build` is interrupted (Ctrl+C, OOM kill) mid-write, a
 * half-written JSON file would make the next `pristine start` think the build was good but
 * fail to parse the manifest. Renaming after a complete write ensures readers either see
 * the previous manifest or the new one — never a torn one.
 */
@injectable()
export class BuildManifestWriter {
  private readonly cacheDirName: string = ".pristine";
  private readonly manifestFileName: string = "build-manifest.json";

  constructor(private readonly sourceHasher: SourceHasher) {
  }

  write(projectRoot: string, sourcePath: string, outputPath: string): BuildManifest {
    const absoluteSource = path.resolve(projectRoot, sourcePath);
    const absoluteOutput = path.resolve(projectRoot, outputPath);

    // Persist the paths RELATIVE to projectRoot so the manifest is relocatable: a build
    // produced in one directory stays valid after the project is moved or copied elsewhere
    // (e.g. an installer that builds in a staging dir then swaps it into place). The hash is
    // still taken from the absolute path; only the relative form is written to disk.
    const manifest = new BuildManifest(
      path.relative(projectRoot, absoluteSource),
      path.relative(projectRoot, absoluteOutput),
      this.sourceHasher.hashFile(absoluteSource),
      new Date().toISOString(),
    );

    const cacheDir = path.resolve(projectRoot, this.cacheDirName);
    fs.mkdirSync(cacheDir, {recursive: true});

    const finalPath = path.resolve(cacheDir, this.manifestFileName);
    const tempPath = finalPath + ".tmp";
    fs.writeFileSync(tempPath, JSON.stringify(manifest, null, 2), "utf8");
    fs.renameSync(tempPath, finalPath);

    return manifest;
  }
}
