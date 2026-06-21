import {injectable} from "tsyringe";
import {injectConfig, moduleScoped} from "@pristine-ts/common";
import * as path from "path";
import {CliModuleKeyname} from "../cli.module.keyname";
import {CliConfigurationKeys} from "../cli.configuration-keys";

/**
 * Resolves the program name shown in generated `Usage:` lines — the name the user actually
 * typed, e.g. `myapp`, not the framework's `pristine`. Resolution is a hybrid, in priority
 * order:
 *
 *   1. the `pristine.cli.binName` configuration, when set (an explicit override for odd launch
 *      shapes like `node dist/bin/cli.cjs`, where argv carries a file name);
 *   2. otherwise `basename(argv[1])` with any `.cjs`/`.js`/`.mjs` extension stripped — the bin
 *      the user invoked, robust across global installs, `npx`, and local `.bin` shims;
 *   3. otherwise the framework default `pristine`.
 */
@injectable()
@moduleScoped(CliModuleKeyname)
export class ProgramNameResolver {
  private static readonly Fallback = "pristine";

  constructor(
    @injectConfig(CliConfigurationKeys.BinName) private readonly configuredBinName: string,
  ) {
  }

  /**
   * Returns the resolved program name. `argv` defaults to `process.argv`; it is a parameter so
   * the REPL (and tests) can resolve a name from a synthetic argv.
   */
  resolve(argv: readonly string[] = process.argv): string {
    const configured = this.configuredBinName?.trim();
    if (configured) {
      return configured;
    }

    const scriptPath = argv[1];
    if (typeof scriptPath === "string" && scriptPath.length > 0) {
      const base = path.basename(scriptPath, path.extname(scriptPath));
      if (base.length > 0) {
        return base;
      }
    }

    return ProgramNameResolver.Fallback;
  }
}
