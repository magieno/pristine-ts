import {createHash} from "crypto";
import {injectable} from "tsyringe";

/**
 * Computes the stable sha256 hex digest of a migration's SQL string. Used both at
 * apply time (to record what was applied) and at status/verify time (to detect
 * drift). Canonicalization strips trivial editor noise — trailing whitespace per
 * line, CRLF endings, leading/trailing whitespace — so identical SQL with different
 * line-ending or final-newline conventions hashes the same.
 *
 * Whitespace *between* tokens is preserved: changing `SELECT  *` to `SELECT *`
 * does change the checksum. That's deliberate — anything beyond formatting noise
 * is a real edit, and the user should know.
 */
@injectable()
export class MysqlMigrationChecksumManager {
  public compute(sql: string): string {
    return createHash("sha256").update(this.canonicalize(sql)).digest("hex");
  }

  private canonicalize(sql: string): string {
    return sql.replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").trim();
  }
}
