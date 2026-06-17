import "reflect-metadata";
import {mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync} from "fs";
import {tmpdir} from "os";
import path from "path";
import {MysqlMigrationScaffoldManager} from "./mysql-migration-scaffold.manager";

describe("MysqlMigrationScaffoldManager", () => {
  let workDir: string;
  let manager: MysqlMigrationScaffoldManager;
  const logHandler = {debug: jest.fn(), info: jest.fn(), warning: jest.fn(), error: jest.fn()};

  beforeEach(() => {
    workDir = mkdtempSync(path.join(tmpdir(), "pristine-mysql-cli-spec-"));
    manager = new MysqlMigrationScaffoldManager(logHandler as any);
    Object.values(logHandler).forEach((fn) => (fn as jest.Mock).mockReset());
  });

  afterEach(() => {
    rmSync(workDir, {recursive: true, force: true});
  });

  describe("slugify", () => {
    it("kebab-cases mixed input", () => {
      expect(manager.slugify("Add Products Table")).toBe("add-products-table");
      expect(manager.slugify("add_products  table!!")).toBe("add-products-table");
      expect(manager.slugify("AddProductsTable")).toBe("addproductstable");
    });
  });

  describe("buildClassName", () => {
    it("PascalCases the slug and appends _NN", () => {
      expect(manager.buildClassName("add-products-table", "03")).toBe("AddProductsTable_03");
      expect(manager.buildClassName("init", "01")).toBe("Init_01");
    });
  });

  describe("create", () => {
    it("creates the directory and writes a numbered file starting at 01", async () => {
      const scaffoldPath = path.join(workDir, "src", "sql-migrations");

      const result = await manager.create({scaffoldPath, descriptiveName: "init"});

      expect(result.migrationName).toBe("01-init");
      expect(result.className).toBe("Init_01");
      expect(result.filePath).toBe(path.join(scaffoldPath, "01-init.sql-migrations.ts"));
      expect(existsSync(result.filePath)).toBe(true);

      const content = readFileSync(result.filePath, "utf8");
      expect(content).toContain('readonly name = "01-init"');
      expect(content).toContain("export class Init_01");
      expect(content).toContain("@tag(\"MysqlMigrationInterface\")");
    });

    it("increments past existing files and keeps the current width", async () => {
      const scaffoldPath = path.join(workDir, "src", "sql-migrations");
      await manager.create({scaffoldPath, descriptiveName: "init"});
      await manager.create({scaffoldPath, descriptiveName: "add-users"});

      const third = await manager.create({scaffoldPath, descriptiveName: "add-orders"});
      expect(third.migrationName).toBe("03-add-orders");
    });

    it("respects an existing 3-digit width", async () => {
      const scaffoldPath = path.join(workDir, "src", "sql-migrations");
      require("fs").mkdirSync(scaffoldPath, {recursive: true});
      writeFileSync(path.join(scaffoldPath, "099-old.sql-migrations.ts"), "");
      writeFileSync(path.join(scaffoldPath, "100-newer.sql-migrations.ts"), "");

      const result = await manager.create({scaffoldPath, descriptiveName: "next-one"});
      expect(result.migrationName).toBe("101-next-one");
    });

    it("emits configUniqueKeynames when provided, comments it out otherwise", async () => {
      const scaffoldPath = path.join(workDir, "src", "sql-migrations");
      const withConfig = await manager.create({
        scaffoldPath,
        descriptiveName: "scoped",
        configUniqueKeynames: ["analytics_db"],
      });
      expect(readFileSync(withConfig.filePath, "utf8"))
        .toContain('readonly configUniqueKeynames = ["analytics_db"];');

      const withoutConfig = await manager.create({scaffoldPath, descriptiveName: "broad"});
      expect(readFileSync(withoutConfig.filePath, "utf8"))
        .toContain("// readonly configUniqueKeynames");
    });

    it("rejects an empty or symbol-only name", async () => {
      const scaffoldPath = path.join(workDir, "src", "sql-migrations");
      await expect(manager.create({scaffoldPath, descriptiveName: "***"}))
        .rejects.toThrow(/Cannot scaffold/);
    });
  });

  describe("create with barrel", () => {
    const barrelSeed = `import {ModuleInterface} from "@pristine-ts/common";
// <pristine:migration-imports:start>
// <pristine:migration-imports:end>

export const SqlMigrationsModule: ModuleInterface = {
  keyname: "my-app.sql-migrations",
  importServices: [
    // <pristine:migration-services:start>
    // <pristine:migration-services:end>
  ],
};
`;

    it("splices the new import and class reference between markers", async () => {
      const scaffoldPath = path.join(workDir, "src", "sql-migrations");
      const barrelPath = path.join(scaffoldPath, "sql-migrations.module.ts");
      require("fs").mkdirSync(scaffoldPath, {recursive: true});
      writeFileSync(barrelPath, barrelSeed);

      const result = await manager.create({scaffoldPath, descriptiveName: "init", barrelPath});
      expect(result.barrelUpdated).toBe(true);

      const updated = readFileSync(barrelPath, "utf8");
      expect(updated).toContain('import {Init_01} from "./01-init.sql-migrations";');
      expect(updated).toContain("Init_01,");
    });

    it("keeps existing entries sorted when adding a new one", async () => {
      const scaffoldPath = path.join(workDir, "src", "sql-migrations");
      const barrelPath = path.join(scaffoldPath, "sql-migrations.module.ts");
      require("fs").mkdirSync(scaffoldPath, {recursive: true});
      writeFileSync(barrelPath, barrelSeed);

      await manager.create({scaffoldPath, descriptiveName: "init", barrelPath});
      await manager.create({scaffoldPath, descriptiveName: "add-users", barrelPath});
      await manager.create({scaffoldPath, descriptiveName: "add-orders", barrelPath});

      const finalBarrel = readFileSync(barrelPath, "utf8");
      const importsBlock = finalBarrel.substring(
        finalBarrel.indexOf("// <pristine:migration-imports:start>"),
        finalBarrel.indexOf("// <pristine:migration-imports:end>"),
      );
      const initIdx = importsBlock.indexOf("AddOrders_03");
      const usersIdx = importsBlock.indexOf("AddUsers_02");
      const startIdx = importsBlock.indexOf("Init_01");
      expect(initIdx).toBeLessThan(usersIdx);
      expect(usersIdx).toBeLessThan(startIdx);
    });

    it("falls back gracefully when barrel is missing", async () => {
      const scaffoldPath = path.join(workDir, "src", "sql-migrations");
      const barrelPath = path.join(scaffoldPath, "does-not-exist.ts");

      const result = await manager.create({scaffoldPath, descriptiveName: "init", barrelPath});
      expect(result.barrelUpdated).toBe(false);
      expect(logHandler.warning).toHaveBeenCalled();
    });

    it("falls back gracefully when markers are missing", async () => {
      const scaffoldPath = path.join(workDir, "src", "sql-migrations");
      const barrelPath = path.join(scaffoldPath, "barrel.ts");
      require("fs").mkdirSync(scaffoldPath, {recursive: true});
      writeFileSync(barrelPath, "export const SqlMigrationsModule = { keyname: 'x', importServices: [] };\n");

      const result = await manager.create({scaffoldPath, descriptiveName: "init", barrelPath});
      expect(result.barrelUpdated).toBe(false);
      expect(logHandler.warning).toHaveBeenCalled();
    });
  });
});
