import {moduleScoped, ServiceDefinitionTagEnum, tag, ExitCode} from "@pristine-ts/common";
import {injectable} from "tsyringe";
import {CommandInterface} from "../interfaces/command.interface";
import {CliModuleKeyname} from "../cli.module.keyname";
import {LogsCommand} from "./logs.command";
import {LogsCommandOptions} from "./logs.command-options";

/**
 * Top-level alias for `p:logs`.
 *
 * Declares the same `optionsType` as the command it delegates to — `optionsType = null`
 * hands `run()` the raw argument object, and `LogsCommandOptions` reads its filter id and
 * its `--limit` through getters, which a raw object does not have. Without the mapping,
 * `pristine logs <id>` would ignore the id and render the whole store.
 */
@tag(ServiceDefinitionTagEnum.Command)
@moduleScoped(CliModuleKeyname)
@injectable()
export class LogsAliasCommand implements CommandInterface<LogsCommandOptions> {
  optionsType = LogsCommandOptions;
  name = "logs";
  description = "Alias for p:logs.";

  constructor(private readonly delegate: LogsCommand) {
  }

  async run(args: LogsCommandOptions): Promise<ExitCode | number> {
    return this.delegate.run(args);
  }
}
