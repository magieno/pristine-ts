import "reflect-metadata";
import {MysqlMigrationChecksumManager} from "./mysql-migration-checksum.manager";

describe("MysqlMigrationChecksumManager", () => {
  const manager = new MysqlMigrationChecksumManager();

  it("produces a 64-character hex digest", () => {
    const checksum = manager.compute("CREATE TABLE users (id INT);");
    expect(checksum).toMatch(/^[0-9a-f]{64}$/);
  });

  it("returns identical digests for identical input", () => {
    const a = manager.compute("CREATE TABLE users (id INT);");
    const b = manager.compute("CREATE TABLE users (id INT);");
    expect(a).toBe(b);
  });

  it("ignores trailing whitespace on each line", () => {
    const a = manager.compute("CREATE TABLE users (id INT);   \nSELECT 1;");
    const b = manager.compute("CREATE TABLE users (id INT);\nSELECT 1;");
    expect(a).toBe(b);
  });

  it("normalizes CRLF to LF", () => {
    const a = manager.compute("CREATE TABLE users (id INT);\r\nSELECT 1;");
    const b = manager.compute("CREATE TABLE users (id INT);\nSELECT 1;");
    expect(a).toBe(b);
  });

  it("ignores leading and trailing whitespace on the whole string", () => {
    const a = manager.compute("\n\n  CREATE TABLE users (id INT);  \n\n");
    const b = manager.compute("CREATE TABLE users (id INT);");
    expect(a).toBe(b);
  });

  it("changes when meaningful content changes", () => {
    const a = manager.compute("CREATE TABLE users (id INT);");
    const b = manager.compute("CREATE TABLE users (id BIGINT);");
    expect(a).not.toBe(b);
  });

  it("preserves whitespace between tokens (a real edit)", () => {
    const a = manager.compute("SELECT  *");
    const b = manager.compute("SELECT *");
    expect(a).not.toBe(b);
  });
});
