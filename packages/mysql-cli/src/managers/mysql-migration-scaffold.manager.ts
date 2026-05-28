import path from "path";
import {promises as fsp} from "fs";
import {inject, injectable} from "tsyringe";
import {LogHandlerInterface} from "@pristine-ts/logging";

/**
 * Generates a new `.sql-migrations.ts` file and optionally splices its registration
 * into a marker-annotated migrations module file. Pure dev-time scaffolding — never
 * touches the database, never resolved at runtime in production.
 *
 * Numbering: scans the target directory for files matching `<digits>-<slug>.sql-migrations.ts`,
 * picks `max + 1`, and pads to the current width (default 2 digits, never narrows).
 * If you cross 99 you'll want to rename existing files to 3-digit padding once; the
 * scaffold respects whichever width it finds.
 */
@injectable()
export class MysqlMigrationScaffoldManager {
  private static readonly FilenamePattern = /^(\d+)-([a-z0-9-]+)\.sql-migrations\.ts$/;

  private static readonly ImportsStart = "// <pristine:migration-imports:start>";
  private static readonly ImportsEnd = "// <pristine:migration-imports:end>";
  private static readonly ServicesStart = "// <pristine:migration-services:start>";
  private static readonly ServicesEnd = "// <pristine:migration-services:end>";

  constructor(
    @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
  ) {
  }

  public async create(options: {
    scaffoldPath: string;
    descriptiveName: string;
    barrelPath?: string;
    configUniqueKeynames?: string[];
  }): Promise<{ filePath: string; className: string; migrationName: string; barrelUpdated: boolean }> {
    const slug = this.slugify(options.descriptiveName);
    if (slug.length === 0) {
      throw new Error(`Cannot scaffold a migration from an empty/symbol-only name: "${options.descriptiveName}".`);
    }

    await fsp.mkdir(options.scaffoldPath, {recursive: true});

    const existingPrefixes = await this.listExistingNumberPrefixes(options.scaffoldPath);
    const width = this.resolveWidth(existingPrefixes);
    const nextNumber = (existingPrefixes.length === 0 ? 0 : Math.max(...existingPrefixes)) + 1;
    const paddedNumber = nextNumber.toString().padStart(width, "0");

    const migrationName = `${paddedNumber}-${slug}`;
    const fileName = `${migrationName}.sql-migrations.ts`;
    const filePath = path.join(options.scaffoldPath, fileName);

    if (await this.exists(filePath)) {
      throw new Error(`Refusing to overwrite existing migration file at ${filePath}.`);
    }

    const className = this.buildClassName(slug, paddedNumber);
    const fileContent = this.renderMigrationFile(className, migrationName, options.configUniqueKeynames);

    await fsp.writeFile(filePath, fileContent, "utf8");

    let barrelUpdated = false;
    if (options.barrelPath !== undefined) {
      barrelUpdated = await this.tryUpdateBarrel({
        barrelPath: options.barrelPath,
        scaffoldPath: options.scaffoldPath,
        migrationFileName: fileName,
        className,
      });
    }

    return {filePath, className, migrationName, barrelUpdated};
  }

  public renderMigrationFile(className: string, migrationName: string, configUniqueKeynames?: string[]): string {
    const configLine = configUniqueKeynames === undefined || configUniqueKeynames.length === 0
      ? `  // readonly configUniqueKeynames = ["__default__"];   // uncomment to scope to specific configs`
      : `  readonly configUniqueKeynames = ${JSON.stringify(configUniqueKeynames)};`;

    return `import {injectable} from "tsyringe";
import {tag} from "@pristine-ts/common";
import {MysqlMigrationInterface} from "@pristine-ts/mysql-cli";

@tag("MysqlMigrationInterface")
@injectable()
export class ${className} implements MysqlMigrationInterface {
  readonly name = "${migrationName}";
${configLine}

  up(): string {
    return \`
      -- write your SQL here
    \`;
  }
}
`;
  }

  public buildClassName(slug: string, paddedNumber: string): string {
    const pascal = slug
      .split("-")
      .filter((part) => part.length > 0)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("");
    return `${pascal}_${paddedNumber}`;
  }

  public slugify(input: string): string {
    return input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  private async tryUpdateBarrel(options: {
    barrelPath: string;
    scaffoldPath: string;
    migrationFileName: string;
    className: string;
  }): Promise<boolean> {
    if (!(await this.exists(options.barrelPath))) {
      this.logHandler.warning("MysqlMigrationScaffoldManager: barrel file not found; skipping auto-edit.", {
        highlights: {barrelPath: options.barrelPath},
      });
      return false;
    }

    const original = await fsp.readFile(options.barrelPath, "utf8");

    if (
      original.indexOf(MysqlMigrationScaffoldManager.ImportsStart) === -1 ||
      original.indexOf(MysqlMigrationScaffoldManager.ImportsEnd) === -1 ||
      original.indexOf(MysqlMigrationScaffoldManager.ServicesStart) === -1 ||
      original.indexOf(MysqlMigrationScaffoldManager.ServicesEnd) === -1
    ) {
      this.logHandler.warning("MysqlMigrationScaffoldManager: marker comments not found in barrel; skipping auto-edit.", {
        highlights: {barrelPath: options.barrelPath},
      });
      return false;
    }

    const relativeImport = this.relativeImportSpecifier(options.barrelPath, options.scaffoldPath, options.migrationFileName);
    const importLine = `import {${options.className}} from "${relativeImport}";`;
    const serviceLine = `${options.className},`;

    const withImport = this.insertSortedBetween(
      original,
      MysqlMigrationScaffoldManager.ImportsStart,
      MysqlMigrationScaffoldManager.ImportsEnd,
      importLine,
    );

    const withService = this.insertSortedBetween(
      withImport,
      MysqlMigrationScaffoldManager.ServicesStart,
      MysqlMigrationScaffoldManager.ServicesEnd,
      serviceLine,
    );

    await fsp.writeFile(options.barrelPath, withService, "utf8");
    return true;
  }

  private insertSortedBetween(source: string, startMarker: string, endMarker: string, newLine: string): string {
    const lines = source.split("\n");
    const startIndex = lines.findIndex((line) => line.trim() === startMarker);
    const endIndex = lines.findIndex((line) => line.trim() === endMarker);

    if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
      return source;
    }

    const indent = (lines[startIndex].match(/^\s*/) ?? [""])[0];
    const existing = lines.slice(startIndex + 1, endIndex).filter((line) => line.trim().length > 0);
    if (existing.some((line) => line.trim() === newLine.trim())) {
      return source;
    }

    const merged = [...existing, `${indent}${newLine}`].sort((a, b) => a.trim().localeCompare(b.trim()));

    return [
      ...lines.slice(0, startIndex + 1),
      ...merged,
      ...lines.slice(endIndex),
    ].join("\n");
  }

  private relativeImportSpecifier(barrelPath: string, scaffoldPath: string, migrationFileName: string): string {
    const barrelDir = path.dirname(path.resolve(barrelPath));
    const migrationAbs = path.resolve(scaffoldPath, migrationFileName);
    let rel = path.relative(barrelDir, migrationAbs).replace(/\\/g, "/");
    rel = rel.replace(/\.ts$/, "");
    if (rel.startsWith(".") === false) {
      rel = `./${rel}`;
    }
    return rel;
  }

  private async listExistingNumberPrefixes(dir: string): Promise<number[]> {
    if (!(await this.exists(dir))) {
      return [];
    }
    const entries = await fsp.readdir(dir);
    const prefixes: number[] = [];
    for (const entry of entries) {
      const match = MysqlMigrationScaffoldManager.FilenamePattern.exec(entry);
      if (match) {
        prefixes.push(parseInt(match[1], 10));
      }
    }
    return prefixes;
  }

  private resolveWidth(existingPrefixes: number[]): number {
    if (existingPrefixes.length === 0) {
      return 2;
    }
    const maxDigits = Math.max(...existingPrefixes.map((n) => n.toString().length));
    return Math.max(2, maxDigits);
  }

  private async exists(filePath: string): Promise<boolean> {
    try {
      await fsp.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
