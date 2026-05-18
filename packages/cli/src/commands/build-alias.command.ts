import {moduleScoped, ServiceDefinitionTagEnum, tag, ExitCode} from "@pristine-ts/common";
import {injectable} from "tsyringe";
import {CommandInterface} from "../interfaces/command.interface";
import {CliModuleKeyname} from "../cli.module.keyname";
import {BuildCommand} from "./build.command";

/**
 * Top-level alias for the framework-reserved `p:build` command. Injects the delegate
 * directly via standard DI.
 */
@tag(ServiceDefinitionTagEnum.Command)
@moduleScoped(CliModuleKeyname)
@injectable()
export class BuildAliasCommand implements CommandInterface<null> {
  optionsType = null;
  name = "build";
  description = "Alias for p:build.";

  constructor(private readonly delegate: BuildCommand) {
  }

  async run(args: any): Promise<ExitCode | number> {
    return this.delegate.run(args);
  }
}
