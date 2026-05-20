import {moduleScoped, ServiceDefinitionTagEnum, tag, ExitCode} from "@pristine-ts/common";
import {injectable} from "tsyringe";
import {CommandInterface} from "../interfaces/command.interface";
import {CliModuleKeyname} from "../cli.module.keyname";
import {RequestsCommand} from "./requests.command";

/**
 * Top-level alias for `p:requests`.
 */
@tag(ServiceDefinitionTagEnum.Command)
@moduleScoped(CliModuleKeyname)
@injectable()
export class RequestsAliasCommand implements CommandInterface<null> {
  optionsType = null;
  name = "requests";
  description = "Alias for p:requests.";

  constructor(private readonly delegate: RequestsCommand) {
  }

  async run(args: any): Promise<ExitCode | number> {
    return this.delegate.run(args);
  }
}
