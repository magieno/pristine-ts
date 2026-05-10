import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {injectable} from "tsyringe";
import {Kernel} from "@pristine-ts/core";
import {CommandInterface} from "../interfaces/command.interface";
import {ExitCodeEnum} from "../enums/exit-code.enum";
import {CliModuleKeyname} from "../cli.module.keyname";
import {HelpCommand} from "./help.command";

/**
 * Top-level alias for the framework-reserved `p:help` command. Resolves the delegate
 * lazily from the kernel container in `run()` rather than constructor-injecting it — a
 * constructor dependency would feed back into HelpCommand's `@injectAll(Command)` and
 * recurse.
 */
@tag(ServiceDefinitionTagEnum.Command)
@moduleScoped(CliModuleKeyname)
@injectable()
export class HelpAliasCommand implements CommandInterface<null> {
  optionsType = null;
  name = "help";
  description = "Alias for p:help.";

  constructor(private readonly kernel: Kernel) {
  }

  async run(args: any): Promise<ExitCodeEnum | number> {
    return this.kernel.container.resolve(HelpCommand).run(args);
  }
}
