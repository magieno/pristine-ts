import path from "path";
import {moduleScoped, ServiceDefinitionTagEnum, tag, ExitCode} from "@pristine-ts/common";
import {inject, injectable} from "tsyringe";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {CommandInterface} from "../interfaces/command.interface";
import {CliOutput} from "../managers/cli-output.manager";
import {CliModuleKeyname} from "../cli.module.keyname";
import {ConfigLoader} from "../config/config-loader";

/**
 * Prints the resolved Pristine configuration plus where it was loaded from. Useful for
 * debugging discovery — when `pristine` is doing something unexpected, the first question is
 * always "which config file did it actually pick up?"
 */
@tag(ServiceDefinitionTagEnum.Command)
@moduleScoped(CliModuleKeyname)
@injectable()
export class ConfigPrintCommand implements CommandInterface<null> {
  optionsType = null;
  name = "p:config:print";
  description = "Print the resolved Pristine configuration plus where it was loaded from.";

  constructor(
    @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
    private readonly cliOutput: CliOutput,
    private readonly configLoader: ConfigLoader,
  ) {
  }

  async run(args: any): Promise<ExitCode | number> {
    const resolved = await this.configLoader.load({startDir: process.cwd()});

    if (resolved.configFilePath !== undefined) {
      this.logHandler.info("Config file loaded", {highlights: {path: path.relative(process.cwd(), resolved.configFilePath)}});
    } else {
      this.logHandler.info("No config file found — running with defaults.");
    }

    this.cliOutput.writeLine("");
    // JSON dump goes through cliOutput so it pipes cleanly — narration above (and
    // provenance below) goes through logHandler for normal CLI rendering.
    this.cliOutput.writeLine(JSON.stringify(resolved.config, null, 2));

    if (Object.keys(resolved.provenance).length > 0) {
      this.cliOutput.writeLine("");
      this.logHandler.info("Provenance:");
      for (const [field, source] of Object.entries(resolved.provenance)) {
        this.cliOutput.writeLine(`  ${field}: ${source}`);
      }
    }

    return ExitCode.Success;
  }
}
