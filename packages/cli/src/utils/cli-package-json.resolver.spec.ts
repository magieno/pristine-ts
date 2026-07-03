import "reflect-metadata";
import fs from "fs";
import os from "os";
import path from "path";
import {CliPackageJsonResolver} from "./cli-package-json.resolver";
import {CLI_VERSION} from "../generated/version";

/**
 * Test seam: forces the filesystem fallback (by making the build-time constant look absent) and
 * lets the base directory be overridden, so both the happy fallback and the ESM (no-`__dirname`)
 * fallback can be exercised deterministically. Under ts-jest `__dirname` is always defined, so
 * overriding it is the only way to reproduce the bundled-ESM situation the fallback must survive.
 */
class FallbackResolver extends CliPackageJsonResolver {
  constructor(private readonly directory: string | undefined) {
    super();
  }

  protected readVersionFromConstant(): string | undefined {
    return undefined; // force the filesystem fallback
  }

  protected getCommonJsDirectory(): string | undefined {
    return this.directory;
  }
}

/**
 * Builds a throwaway package layout mirroring the compiled output — `<root>/dist/lib/cjs/utils`
 * with `<root>/package.json` four levels up — so the fallback resolves the same way it does
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
  describe("readVersion (primary: build-time constant)", () => {
    it("returns the generated CLI_VERSION constant", () => {
      // The constant is the primary, bundle-safe source — this is what makes `pristine info`
      // report the right version in CommonJS, native ESM, and bundled ESM alike.
      expect(new CliPackageJsonResolver().readVersion()).toBe(CLI_VERSION);
    });

    it("does not degrade to 'unknown' (the constant is always present after build/pretest)", () => {
      const version = new CliPackageJsonResolver().readVersion();

      expect(version).not.toBe("unknown");
      expect(version.length).toBeGreaterThan(0);
    });

    it("does not touch the filesystem when the constant is available", () => {
      const spy = jest.spyOn(fs, "readFileSync");
      try {
        new CliPackageJsonResolver().readVersion();
        expect(spy).not.toHaveBeenCalled();
      } finally {
        spy.mockRestore();
      }
    });
  });

  describe("readVersion (filesystem fallback, when the constant is absent)", () => {
    it("reads the version from the package.json four levels above the module directory", () => {
      const directory = makePackageFixture(JSON.stringify({name: "@pristine-ts/cli", version: "9.9.9"}));

      expect(new FallbackResolver(directory).readVersion()).toBe("9.9.9");
    });

    it("returns 'unknown' (never throws) when there is no __dirname — the bundled-ESM case", () => {
      // In an ESM bundle `__dirname` is not defined; reading it bare would throw
      // `ReferenceError: __dirname is not defined`. The guarded fallback must degrade instead.
      expect(new FallbackResolver(undefined).readVersion()).toBe("unknown");
    });

    it("returns 'unknown' when the package.json cannot be found", () => {
      expect(new FallbackResolver("/definitely/not/a/real/dir/lib/cjs/utils").readVersion()).toBe("unknown");
    });

    it("returns 'unknown' when the package.json has no version field", () => {
      const directory = makePackageFixture(JSON.stringify({name: "@pristine-ts/cli"}));

      expect(new FallbackResolver(directory).readVersion()).toBe("unknown");
    });

    it("returns 'unknown' when the package.json is malformed rather than throwing", () => {
      const directory = makePackageFixture("{ this is not json");

      expect(new FallbackResolver(directory).readVersion()).toBe("unknown");
    });
  });

  describe("laziness", () => {
    it("does not touch the filesystem when constructed", () => {
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
