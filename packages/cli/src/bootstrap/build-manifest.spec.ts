import "reflect-metadata";
import fs from "fs";
import os from "os";
import path from "path";
import {BuildManifest} from "./build-manifest";
import {BuildManifestChecker} from "./build-manifest-checker";
import {BuildManifestReader} from "./build-manifest-reader";
import {BuildManifestStalenessEnum} from "./build-manifest-staleness.enum";
import {BuildManifestWriter} from "./build-manifest-writer";
import {SourceHasher} from "./source-hasher";

describe("Build manifest", () => {
  let projectRoot: string;
  let sourceHasher: SourceHasher;
  let writer: BuildManifestWriter;
  let reader: BuildManifestReader;
  let checker: BuildManifestChecker;

  beforeEach(() => {
    projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "pristine-manifest-"));
    sourceHasher = new SourceHasher();
    writer = new BuildManifestWriter(sourceHasher);
    reader = new BuildManifestReader();
    checker = new BuildManifestChecker(sourceHasher);
  });

  afterEach(() => {
    fs.rmSync(projectRoot, {recursive: true, force: true});
  });

  const writeFile = (relPath: string, body: string) => {
    const abs = path.resolve(projectRoot, relPath);
    fs.mkdirSync(path.dirname(abs), {recursive: true});
    fs.writeFileSync(abs, body);
    return abs;
  };

  describe("SourceHasher", () => {
    it("produces a sha256-prefixed digest of file contents", () => {
      const file = writeFile("src/foo.ts", "const x = 1;");
      const digest = sourceHasher.hashFile(file);
      expect(digest).toMatch(/^sha256:[0-9a-f]{64}$/);
    });

    it("produces a different digest when contents change", () => {
      const file = writeFile("src/foo.ts", "const x = 1;");
      const before = sourceHasher.hashFile(file);
      fs.writeFileSync(file, "const x = 2;");
      const after = sourceHasher.hashFile(file);
      expect(before).not.toEqual(after);
    });
  });

  describe("BuildManifestWriter + BuildManifestReader round-trip", () => {
    it("writes a manifest that reads back identically", () => {
      writeFile("src/app.module.ts", "export const AppModule = {};");
      writeFile("dist/app.module.js", "module.exports = {};");

      const written = writer.write(projectRoot, "src/app.module.ts", "dist/app.module.js");
      const read = reader.read(projectRoot);

      expect(read).toBeDefined();
      expect(read!.appModuleSourcePath).toBe(written.appModuleSourcePath);
      expect(read!.appModuleOutputPath).toBe(written.appModuleOutputPath);
      expect(read!.sourceHash).toBe(written.sourceHash);
      expect(read!.builtAt).toBe(written.builtAt);
    });

    it("stores paths relative to the project root", () => {
      writeFile("src/app.module.ts", "x");
      writeFile("dist/app.module.js", "y");
      const manifest = writer.write(projectRoot, "src/app.module.ts", "dist/app.module.js");
      expect(manifest.appModuleSourcePath).toBe(path.join("src", "app.module.ts"));
      expect(manifest.appModuleOutputPath).toBe(path.join("dist", "app.module.js"));
      expect(path.isAbsolute(manifest.appModuleSourcePath)).toBe(false);
    });

    it("returns undefined when no manifest file exists", () => {
      expect(reader.read(projectRoot)).toBeUndefined();
    });

    it("creates the .pristine directory if missing", () => {
      writeFile("src/app.module.ts", "x");
      writeFile("dist/app.module.js", "y");
      expect(fs.existsSync(path.resolve(projectRoot, ".pristine"))).toBe(false);
      writer.write(projectRoot, "src/app.module.ts", "dist/app.module.js");
      expect(fs.existsSync(path.resolve(projectRoot, ".pristine"))).toBe(true);
    });
  });

  describe("BuildManifestChecker", () => {
    it("returns Missing when no manifest exists", () => {
      writeFile("src/app.module.ts", "x");
      writeFile("dist/app.module.js", "y");
      expect(checker.check(undefined, projectRoot, "src/app.module.ts", "dist/app.module.js"))
        .toBe(BuildManifestStalenessEnum.Missing);
    });

    it("returns Fresh when manifest matches current state", () => {
      writeFile("src/app.module.ts", "x");
      writeFile("dist/app.module.js", "y");
      const manifest = writer.write(projectRoot, "src/app.module.ts", "dist/app.module.js");
      expect(checker.check(manifest, projectRoot, "src/app.module.ts", "dist/app.module.js"))
        .toBe(BuildManifestStalenessEnum.Fresh);
    });

    it("returns SourcePathChanged when config sourcePath differs from manifest", () => {
      writeFile("src/app.module.ts", "x");
      writeFile("src/different.module.ts", "x");
      writeFile("dist/app.module.js", "y");
      const manifest = writer.write(projectRoot, "src/app.module.ts", "dist/app.module.js");
      expect(checker.check(manifest, projectRoot, "src/different.module.ts", "dist/app.module.js"))
        .toBe(BuildManifestStalenessEnum.SourcePathChanged);
    });

    it("returns OutputPathChanged when config outputPath differs from manifest", () => {
      writeFile("src/app.module.ts", "x");
      writeFile("dist/app.module.js", "y");
      writeFile("dist/different.module.js", "y");
      const manifest = writer.write(projectRoot, "src/app.module.ts", "dist/app.module.js");
      expect(checker.check(manifest, projectRoot, "src/app.module.ts", "dist/different.module.js"))
        .toBe(BuildManifestStalenessEnum.OutputPathChanged);
    });

    it("returns SourceContentChanged when source contents change", () => {
      writeFile("src/app.module.ts", "original");
      writeFile("dist/app.module.js", "y");
      const manifest = writer.write(projectRoot, "src/app.module.ts", "dist/app.module.js");
      fs.writeFileSync(path.resolve(projectRoot, "src/app.module.ts"), "modified");
      expect(checker.check(manifest, projectRoot, "src/app.module.ts", "dist/app.module.js"))
        .toBe(BuildManifestStalenessEnum.SourceContentChanged);
    });

    it("returns OutputMissing when the compiled output was deleted", () => {
      writeFile("src/app.module.ts", "x");
      writeFile("dist/app.module.js", "y");
      const manifest = writer.write(projectRoot, "src/app.module.ts", "dist/app.module.js");
      fs.unlinkSync(path.resolve(projectRoot, "dist/app.module.js"));
      expect(checker.check(manifest, projectRoot, "src/app.module.ts", "dist/app.module.js"))
        .toBe(BuildManifestStalenessEnum.OutputMissing);
    });

    it("returns SourceContentChanged when source itself is deleted", () => {
      writeFile("src/app.module.ts", "x");
      writeFile("dist/app.module.js", "y");
      const manifest = writer.write(projectRoot, "src/app.module.ts", "dist/app.module.js");
      fs.unlinkSync(path.resolve(projectRoot, "src/app.module.ts"));
      expect(checker.check(manifest, projectRoot, "src/app.module.ts", "dist/app.module.js"))
        .toBe(BuildManifestStalenessEnum.SourceContentChanged);
    });

    it("stays Fresh after the built project is relocated (relative paths)", () => {
      writeFile("src/app.module.ts", "x");
      writeFile("dist/app.module.js", "y");
      const manifest = writer.write(projectRoot, "src/app.module.ts", "dist/app.module.js");

      // Recreate the same tree under a different root and validate the manifest against it —
      // as if the project (and its .pristine manifest) had been built here then moved there.
      const movedRoot = fs.mkdtempSync(path.join(os.tmpdir(), "pristine-moved-"));
      try {
        fs.mkdirSync(path.resolve(movedRoot, "src"), {recursive: true});
        fs.mkdirSync(path.resolve(movedRoot, "dist"), {recursive: true});
        fs.writeFileSync(path.resolve(movedRoot, "src/app.module.ts"), "x");
        fs.writeFileSync(path.resolve(movedRoot, "dist/app.module.js"), "y");
        expect(checker.check(manifest, movedRoot, "src/app.module.ts", "dist/app.module.js"))
          .toBe(BuildManifestStalenessEnum.Fresh);
      } finally {
        fs.rmSync(movedRoot, {recursive: true, force: true});
      }
    });

    it("accepts a legacy manifest that stored absolute paths", () => {
      const absSource = writeFile("src/app.module.ts", "x");
      const absOutput = writeFile("dist/app.module.js", "y");
      // Older versions persisted absolute paths; path.resolve leaves them untouched, so a
      // legacy manifest must still validate as Fresh.
      const legacy = new BuildManifest(
        absSource,
        absOutput,
        sourceHasher.hashFile(absSource),
        new Date().toISOString(),
      );
      expect(checker.check(legacy, projectRoot, "src/app.module.ts", "dist/app.module.js"))
        .toBe(BuildManifestStalenessEnum.Fresh);
    });
  });
});
