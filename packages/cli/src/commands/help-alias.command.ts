import {moduleScoped, ServiceDefinitionTagEnum, tag, ExitCode} from "@pristine-ts/common";
import {injectable} from "tsyringe";
import {CommandInterface} from "../interfaces/command.interface";
import {CliModuleKeyname} from "../cli.module.keyname";
import {HelpCommand} from "./help.command";

/**
 * Top-level alias for the framework-reserved `p:help` command. Injects the delegate
 * directly via standard DI — `HelpCommand` is `@injectable()` and tsyringe resolves it
 * recursively when this alias is constructed. The two share state via DI, not via a
 * service-locator handle to the kernel container.
 */
@tag(ServiceDefinitionTagEnum.Command)
@moduleScoped(CliModuleKeyname)
@injectable()
export class HelpAliasCommand implements CommandInterface<null> {
  optionsType = null;
  name = "help";
  description = "Alias for p:help.";

  constructor(private readonly delegate: HelpCommand) {
  }

  async run(args: any): Promise<ExitCode | number> {
    return this.delegate.run(args);
  }
}
