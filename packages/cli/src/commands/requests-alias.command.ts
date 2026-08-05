import {moduleScoped, ServiceDefinitionTagEnum, tag, ExitCode} from "@pristine-ts/common";
import {injectable} from "tsyringe";
import {CommandInterface} from "../interfaces/command.interface";
import {CliModuleKeyname} from "../cli.module.keyname";
import {RequestsCommand} from "./requests.command";
import {RequestsCommandOptions} from "./requests.command-options";

/**
 * Top-level alias for `p:requests`.
 *
 * Declares the same `optionsType` as the command it delegates to, so `--limit` is mapped
 * and validated on the alias path too. With `optionsType = null` the raw argument object
 * reaches `run()` unchecked — `--limit abc` would have travelled through as a string.
 */
@tag(ServiceDefinitionTagEnum.Command)
@moduleScoped(CliModuleKeyname)
@injectable()
export class RequestsAliasCommand implements CommandInterface<RequestsCommandOptions> {
  optionsType = RequestsCommandOptions;
  name = "requests";
  description = "Alias for p:requests.";

  constructor(private readonly delegate: RequestsCommand) {
  }

  async run(args: RequestsCommandOptions): Promise<ExitCode | number> {
    return this.delegate.run(args);
  }
}
