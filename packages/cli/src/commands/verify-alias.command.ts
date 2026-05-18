import {moduleScoped, ServiceDefinitionTagEnum, tag, ExitCode} from "@pristine-ts/common";
import {injectable} from "tsyringe";
import {CommandInterface} from "../interfaces/command.interface";
import {CliModuleKeyname} from "../cli.module.keyname";
import {VerifyCommand} from "./verify.command";

/**
 * Top-level alias for the framework-reserved `p:verify` command. Injects the delegate
 * directly via standard DI.
 */
@tag(ServiceDefinitionTagEnum.Command)
@moduleScoped(CliModuleKeyname)
@injectable()
export class VerifyAliasCommand implements CommandInterface<null> {
  optionsType = null;
  name = "verify";
  description = "Alias for p:verify.";

  constructor(private readonly delegate: VerifyCommand) {
  }

  async run(args: any): Promise<ExitCode | number> {
    return this.delegate.run(args);
  }
}
