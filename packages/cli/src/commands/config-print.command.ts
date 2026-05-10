import path from "path";
import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {injectable} from "tsyringe";
import {CommandInterface} from "../interfaces/command.interface";
import {ConsoleManager} from "../managers/console.manager";
import {ExitCodeEnum} from "../enums/exit-code.enum";
import {CliModuleKeyname} from "../cli.module.keyname";
import {loadConfig} from "../config/config-loader";

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

  constructor(private readonly consoleManager: ConsoleManager) {
  }

  async run(args: any): Promise<ExitCodeEnum | number> {
    const resolved = await loadConfig({startDir: process.cwd()});

    if (resolved.configFilePath !== undefined) {
      this.consoleManager.writeInfo(`Config file: ${path.relative(process.cwd(), resolved.configFilePath)}`);
    } else {
      this.consoleManager.writeInfo("No config file found — running with defaults.");
    }

    this.consoleManager.writeLine("");
    this.consoleManager.writeLine(JSON.stringify(resolved.config, null, 2));

    if (Object.keys(resolved.provenance).length > 0) {
      this.consoleManager.writeLine("");
      this.consoleManager.writeInfo("Provenance:");
      for (const [field, source] of Object.entries(resolved.provenance)) {
        this.consoleManager.writeLine(`  ${field}: ${source}`);
      }
    }

    return ExitCodeEnum.Success;
  }
}
