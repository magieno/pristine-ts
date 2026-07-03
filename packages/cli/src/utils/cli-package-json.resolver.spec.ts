import "reflect-metadata";
import fs from "fs";
import os from "os";
import path from "path";
import {CliPackageJsonResolver} from "./cli-package-json.resolver";

/**
 * Test seam: overrides the CommonJS-directory lookup so both the happy path (a known base
 * directory) and the ESM path (no `__dirname` in scope) can be exercised deterministically.
 * Under ts-jest `__dirname` is always defined, so overriding it is the only way to reproduce the
 * bundled-ESM `__dirname is not defined` situation this resolver is meant to survive.
 */
class ConfigurableResolver extends CliPackageJsonResolver {
  constructor(private readonly directory: string | undefined) {
    super();
  }

  protected getCommonJsDirectory(): string | undefined {
    return this.directory;
  }
}

/**
 * Builds a throwaway package layout mirroring the compiled output — `<root>/dist/lib/cjs/utils`
 * with `<root>/package.json` four levels up — so `readVersion()` resolves the same way it does
 * against the real build. Returns the deep directory a resolver would see as its `__dirname`.
 */
const makePackageFixture = (packageJsonContents: string | null): string => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "pristine-cli-pkg-"));
  if (packageJsonContents !== null) {
    fs.writeFileSync(path.join(root, "package.json"), packageJsonContents);
  }
  const deepDirectory = path.join(root, "dist", "lib", "cjs", "utils");
  fs.mkdirSync(deepDirectory, {recursive: true});
  return deepDirectory;
};

describe("CliPackageJsonResolver", () => {
  describe("readVersion", () => {
    it("reads the version from the package.json four levels above the module directory", () => {
      const directory = makePackageFixture(JSON.stringify({name: "@pristine-ts/cli", version: "9.9.9"}));

      expect(new ConfigurableResolver(directory).readVersion()).toBe("9.9.9");
    });

    it("returns 'unknown' (never throws) when there is no __dirname — the bundled-ESM case", () => {
      // This is the regression: in an ESM bundle `__dirname` is not defined; reading it bare would
      // throw `ReferenceError: __dirname is not defined` and crash. The resolver must degrade.
      expect(new ConfigurableResolver(undefined).readVersion()).toBe("unknown");
    });

    it("returns 'unknown' when the package.json cannot be found", () => {
      expect(new ConfigurableResolver("/definitely/not/a/real/dir/lib/cjs/utils").readVersion()).toBe("unknown");
    });

    it("returns 'unknown' when the package.json has no version field", () => {
      const directory = makePackageFixture(JSON.stringify({name: "@pristine-ts/cli"}));

      expect(new ConfigurableResolver(directory).readVersion()).toBe("unknown");
    });

    it("returns 'unknown' when the package.json is malformed rather than throwing", () => {
      const directory = makePackageFixture("{ this is not json");

      expect(new ConfigurableResolver(directory).readVersion()).toBe("unknown");
    });

    it("does not throw in the real (CommonJS) test runtime and yields a non-empty string", () => {
      // Under ts-jest `__dirname` is defined, so the real code path runs end to end.
      const version = new CliPackageJsonResolver().readVersion();

      expect(typeof version).toBe("string");
      expect(version.length).toBeGreaterThan(0);
    });
  });

  describe("laziness", () => {
    it("does not touch the filesystem when constructed — only when readVersion() is called", () => {
      const spy = jest.spyOn(fs, "readFileSync");
      try {
        // eslint-disable-next-line no-new
        new CliPackageJsonResolver();
        expect(spy).not.toHaveBeenCalled();
      } finally {
        spy.mockRestore();
      }
    });
  });
});
