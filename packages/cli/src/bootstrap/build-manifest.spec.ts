import "reflect-metadata";
import fs from "fs";
import os from "os";
import path from "path";
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
  });
});
