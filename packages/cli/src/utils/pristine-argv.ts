import * as path from "path";

/**
 * Parses an argv array — typically `process.argv` — to locate the pristine bin and
 * extract the user-typed arguments that follow it.
 *
 * Why scan rather than positional-index: argv shape is runtime-dependent. Node and Bun
 * happen to put `[executable, scriptPath, ...userArgs]` today, but a different runtime
 * (or a launcher that prepends flags before the script) can violate that. Locating the
 * bin by name — an element whose basename (stripped of any extension like `.cjs` /
 * `.js` / `.mjs`) is `pristine` — is robust across:
 *
 *   - global installs (`pristine repl` → argv contains `/usr/local/.../pristine.cjs`)
 *   - local installs (`./node_modules/.bin/pristine`)
 *   - `npx pristine`
 *   - direct `node dist/bin/pristine.cjs`
 *   - alternative runtimes that may shape argv differently
 *   - the synthetic argv the REPL handler builds for each typed line
 *
 * Stateless after construction; instantiate per parse.
 */
export class PristineArgv {
  private static readonly BIN_NAME = "pristine";

  /** The argv element identified as the pristine bin (empty when not found). */
  public readonly scriptPath: string;

  /** Every argv element after the pristine bin, in order. */
  public readonly userArgs: readonly string[];

  constructor(rawArgv: readonly unknown[]) {
    const binIndex = rawArgv.findIndex(arg => PristineArgv.isPristineBin(arg));
    if (binIndex === -1) {
      this.scriptPath = "";
      this.userArgs = [];
      return;
    }
    const scriptPath = rawArgv[binIndex];
    this.scriptPath = typeof scriptPath === "string" ? scriptPath : "";
    this.userArgs = rawArgv
      .slice(binIndex + 1)
      .filter((arg): arg is string => typeof arg === "string");
  }

  /**
   * True when the argv was recognizable as a pristine invocation (the bin token was
   * located). Mappers short-circuit `supportsMapping` on this.
   */
  get isValid(): boolean {
    return this.scriptPath !== "";
  }

  private static isPristineBin(arg: unknown): boolean {
    if (typeof arg !== "string") {
      return false;
    }
    return path.basename(arg, path.extname(arg)) === PristineArgv.BIN_NAME;
  }
}
