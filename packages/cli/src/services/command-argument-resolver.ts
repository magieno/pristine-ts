import {injectable} from "tsyringe";
import {moduleScoped} from "@pristine-ts/common";
import {CommandInterface} from "../interfaces/command.interface";
import {CliModuleKeyname} from "../cli.module.keyname";
import {CommandOptionsResolver} from "./command-options-resolver";

/**
 * Maps a command's raw parsed arguments onto a typed, validated instance of its
 * `optionsType`. Used by both the one-shot dispatch path (`CliEventHandler.resolveArgs`)
 * and the interactive REPL (which dispatches via that same handler), so command
 * arguments are resolved through identical logic everywhere.
 *
 * Thin wrapper over `CommandOptionsResolver`: it passes the raw argv straight through for
 * commands that opt out of typed options (`optionsType === null`) and otherwise delegates
 * the prompt → map → validate pipeline. Commands (or dynamic flows) that need to fill an
 * options class directly can inject `CommandOptionsResolver` instead.
 */
@injectable()
@moduleScoped(CliModuleKeyname)
export class CommandArgumentResolver {
  constructor(
    private readonly commandOptionsResolver: CommandOptionsResolver,
  ) {
  }

  /**
   * For commands that opt out of typed options (`optionsType === null`), passes the raw
   * args through unchanged. Otherwise delegates to `CommandOptionsResolver`, which fills any
   * missing `@commandParameter` values by prompting, maps the result onto `optionsType`, and
   * validates it.
   */
  async resolve(command: CommandInterface<any>, rawArgs: any): Promise<any> {
    if (command.optionsType === null) {
      return rawArgs;
    }
    return this.commandOptionsResolver.resolve(command.optionsType, rawArgs);
  }
}
