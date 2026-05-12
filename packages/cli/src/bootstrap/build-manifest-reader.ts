import {injectable} from "tsyringe";
import fs from "fs";
import path from "path";
import {BuildManifest} from "./build-manifest";

/**
 * Reads `<projectRoot>/.pristine/build-manifest.json` if present and returns a `BuildManifest`
 * instance. Used by `AppModuleLoader` and `BuildManifestChecker` to inspect the last build.
 *
 * Returns `undefined` (not throws) when the manifest is missing — that's a normal state for
 * fresh projects that haven't run `pristine build` yet. Genuine errors (corrupt JSON, IO
 * failure) do throw, since silently treating those as "no manifest" would mask real problems.
 */
@injectable()
export class BuildManifestReader {
  private readonly cacheDirName: string = ".pristine";
  private readonly manifestFileName: string = "build-manifest.json";

  read(projectRoot: string): BuildManifest | undefined {
    const manifestPath = path.resolve(projectRoot, this.cacheDirName, this.manifestFileName);
    if (fs.existsSync(manifestPath) === false) {
      return undefined;
    }

    const raw = fs.readFileSync(manifestPath, "utf8");
    const parsed = JSON.parse(raw);

    return new BuildManifest(
      parsed.appModuleSourcePath,
      parsed.appModuleOutputPath,
      parsed.sourceHash,
      parsed.builtAt,
    );
  }
}
