import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {injectable} from "tsyringe";
import {Kernel} from "@pristine-ts/core";
import {CommandInterface} from "../interfaces/command.interface";
import {ExitCodeEnum} from "../enums/exit-code.enum";
import {CliModuleKeyname} from "../cli.module.keyname";
import {VerifyCommand} from "./verify.command";

/**
 * Top-level alias for the framework-reserved `p:verify` command. Lazy delegate resolution —
 * see `HelpAliasCommand` for the rationale.
 */
@tag(ServiceDefinitionTagEnum.Command)
@moduleScoped(CliModuleKeyname)
@injectable()
export class VerifyAliasCommand implements CommandInterface<null> {
  optionsType = null;
  name = "verify";
  description = "Alias for p:verify.";

  constructor(private readonly kernel: Kernel) {
  }

  async run(args: any): Promise<ExitCodeEnum | number> {
    return this.kernel.container.resolve(VerifyCommand).run(args);
  }
}
