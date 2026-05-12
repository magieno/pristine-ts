import {injectable} from "tsyringe";
import {createHash} from "crypto";
import fs from "fs";

/**
 * Computes the content hash that goes into the build manifest. SHA-256 because it's
 * collision-free for our purposes, ships with Node, and the hex digest is short enough
 * to pretty-print in error messages without truncating.
 *
 * The hash is just a fingerprint of the source file's bytes — no AST awareness, no
 * imports-aware tracing. That's intentional: a deeper hash (e.g. of the whole source tree)
 * adds complexity and IO without changing the staleness story for the common case (user
 * edits app.module.ts → hash changes → CLI tells them to rebuild).
 */
@injectable()
export class SourceHasher {
  private readonly algorithm: string = "sha256";
  private readonly digestPrefix: string = "sha256:";

  hashFile(absolutePath: string): string {
    const hash = createHash(this.algorithm);
    hash.update(fs.readFileSync(absolutePath));
    return this.digestPrefix + hash.digest("hex");
  }
}
