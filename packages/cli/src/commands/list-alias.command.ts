import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {injectable} from "tsyringe";
import {CommandInterface} from "../interfaces/command.interface";
import {ExitCodeEnum} from "../enums/exit-code.enum";
import {CliModuleKeyname} from "../cli.module.keyname";
import {ListCommand} from "./list.command";

/**
 * Top-level alias for the framework-reserved `p:list` command. Injects the delegate
 * directly via standard DI.
 */
@tag(ServiceDefinitionTagEnum.Command)
@moduleScoped(CliModuleKeyname)
@injectable()
export class ListAliasCommand implements CommandInterface<null> {
  optionsType = null;
  name = "list";
  description = "Alias for p:list.";

  constructor(private readonly delegate: ListCommand) {
  }

  async run(args: any): Promise<ExitCodeEnum | number> {
    return this.delegate.run(args);
  }
}
