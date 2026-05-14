import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {injectable} from "tsyringe";
import {CommandInterface} from "../interfaces/command.interface";
import {ExitCodeEnum} from "../enums/exit-code.enum";
import {CliModuleKeyname} from "../cli.module.keyname";
import {InfoCommand} from "./info.command";

/**
 * Top-level alias for the framework-reserved `p:info` command. Injects the delegate
 * directly via standard DI.
 */
@tag(ServiceDefinitionTagEnum.Command)
@moduleScoped(CliModuleKeyname)
@injectable()
export class InfoAliasCommand implements CommandInterface<null> {
  optionsType = null;
  name = "info";
  description = "Alias for p:info.";

  constructor(private readonly delegate: InfoCommand) {
  }

  async run(args: any): Promise<ExitCodeEnum | number> {
    return this.delegate.run(args);
  }
}
