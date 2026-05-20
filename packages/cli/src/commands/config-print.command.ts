import path from "path";
import {moduleScoped, ServiceDefinitionTagEnum, tag, ExitCode} from "@pristine-ts/common";
import {injectable} from "tsyringe";
import {CommandInterface} from "../interfaces/command.interface";
import {CliOutput} from "../managers/cli-output.manager";
import {CliModuleKeyname} from "../cli.module.keyname";
import {ConfigLoader} from "../config/config-loader";

/**
 * Prints the resolved Pristine configuration plus where it was loaded from. Useful for
 * debugging discovery — when `pristine` is doing something unexpected, the first question is
 * always "which config file did it actually pick up?"
 *
 * This is a report command: its entire output is the report. It goes through `CliOutput`
 * exclusively (not `LogHandler`) so the dump pipes/redirects cleanly — `pristine
 * p:config:print > config.json` must produce a usable file, with no severity gating, no
 * per-line timestamp/icon decoration, and no fan-out to file/Sentry transports.
 */
@tag(ServiceDefinitionTagEnum.Command)
@moduleScoped(CliModuleKeyname)
@injectable()
export class ConfigPrintCommand implements CommandInterface<null> {
  optionsType = null;
  name = "p:config:print";
  description = "Print the resolved Pristine configuration plus where it was loaded from.";

  constructor(
    private readonly cliOutput: CliOutput,
    private readonly configLoader: ConfigLoader,
  ) {
  }

  async run(args: any): Promise<ExitCode | number> {
    const resolved = await this.configLoader.load({startDir: process.cwd()});

    if (resolved.configFilePath !== undefined) {
      this.cliOutput.writeLine(`Config file: ${path.relative(process.cwd(), resolved.configFilePath)}`);
    } else {
      this.cliOutput.writeLine("No config file found — running with defaults.");
    }

    this.cliOutput.writeLine("");
    this.cliOutput.writeLine(JSON.stringify(resolved.config, null, 2));

    if (Object.keys(resolved.provenance).length > 0) {
      this.cliOutput.writeLine("");
      this.cliOutput.writeLine("Provenance:");
      for (const [field, source] of Object.entries(resolved.provenance)) {
        this.cliOutput.writeLine(`  ${field}: ${source}`);
      }
    }

    return ExitCode.Success;
  }
}
