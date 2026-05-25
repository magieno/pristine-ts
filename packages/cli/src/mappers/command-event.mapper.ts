import {
  Event,
  EventIdManager,
  EventMapperInterface,
  EventResponse,
  EventsExecutionOptionsInterface,
  ExecutionContextInterface,
  ExecutionContextKeynameEnum
} from "@pristine-ts/core";
import {injectable} from "tsyringe";
import {CommandEventPayload} from "../event-payloads/command.event-payload";
import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {CliModuleKeyname} from "../cli.module.keyname";
import {PristineArgv} from "../utils/pristine-argv";

@tag(ServiceDefinitionTagEnum.EventMapper)
@moduleScoped(CliModuleKeyname)
@injectable()
export class CommandEventMapper implements EventMapperInterface<CommandEventPayload, number> {
  constructor(private readonly eventIdManager: EventIdManager) {
  }

  /**
   * Matches argv that names an explicit command. The no-command shape and the bare
   * `pristine repl` form are deliberately rejected here; `ReplStartEventMapper` claims
   * those. Commands typed inside the interactive session are also re-dispatched under
   * `Cli`, so this mapper handles them too. Argv parsing is delegated to `PristineArgv`,
   * which scans for the bin token rather than relying on positional indexing.
   */
  supportsMapping(rawEvent: any, executionContext: ExecutionContextInterface<any>): boolean {
    if (executionContext.keyname !== ExecutionContextKeynameEnum.Cli) {
      return false;
    }
    if (Array.isArray(rawEvent) === false) {
      return false;
    }
    const argv = new PristineArgv(rawEvent);
    if (argv.isValid === false) {
      return false;
    }
    return argv.userArgs.length >= 1 && argv.userArgs[0] !== "repl";
  }

  /**
   * Inspired from: https://github.com/eveningkid/args-parser
   * @param rawEvent
   * @param executionContext
   */
  map(rawEvent: any, executionContext: ExecutionContextInterface<any>): EventsExecutionOptionsInterface<CommandEventPayload> {
    // `supportsMapping` already filters out the unsupported shapes — these guards stay only
    // as a defence in case the pipeline ever invokes `map` without consulting `supportsMapping`.
    if (Array.isArray(rawEvent) === false) {
      throw new Error("If using the 'CLI', process.argv should be passed as the event.");
    }

    const argv = new PristineArgv(rawEvent);
    if (argv.isValid === false || argv.userArgs.length === 0) {
      throw new Error("If using the 'CLI', there must be at least one command passed");
    }
    const command = new CommandEventPayload(argv.userArgs[0], argv.scriptPath);

    // if argument starts with - or --, then there is two options. Either there's an equal sign in the string and after the equal sign is the value or the next argument is actually the value
    // for the value, we need to check if it can be a boolean and if not, if it can be a number. If yes, they should be transformed. Else, the value should be a string.
    // If the argument doesn't start with --, then it's value is simply the true boolean
    const passedArguments = argv.userArgs.slice(1);
    for (let i = 0; i < passedArguments.length; i++) {
      const arg: string = passedArguments[i];
      if (arg.startsWith("-") === false) {
        // Bare (non-dashed) tokens are positionals. Kept as `arguments[arg] = true` for
        // backward compatibility, and additionally collected in order under the reserved
        // `_` key so commands like `trace <id>` / `logs <id>` can read a real positional.
        command.arguments[arg] = true;
        if (Array.isArray(command.arguments._) === false) {
          command.arguments._ = [];
        }
        (command.arguments._ as string[]).push(arg);
        continue;
      }

      const numberOfStartingDashes = arg.startsWith("--") ? 2 : 1;

      const argumentName = arg.slice(numberOfStartingDashes);

      // If there's an equal sign in the name, that's the value. ex: --parameter=value
      const indexOfEqualSign = argumentName.indexOf("=");
      if (numberOfStartingDashes === 2 && indexOfEqualSign != -1) {
        const actualArgumentName = argumentName.slice(0, indexOfEqualSign);
        const actualArgumentValue = argumentName.slice(indexOfEqualSign + 1)

        if (command.arguments[actualArgumentName] !== undefined && Array.isArray(command.arguments[actualArgumentName]) === false) {
          command.arguments[actualArgumentName] = [command.arguments[actualArgumentName] as (string)];
        }

        if (Array.isArray(command.arguments[actualArgumentName])) {
          (command.arguments[actualArgumentName] as (string | number | boolean)[]).push(actualArgumentValue);
          continue;
        }

        // Else, directly assign it
        command.arguments[actualArgumentName] = actualArgumentValue;
        continue;
      }

      // If there are no more passed arguments or the next one also starts with '-' or '--', then simply assign true.
      if ((i + 1) >= passedArguments.length || passedArguments[i + 1].startsWith('-')) {
        command.arguments[argumentName] = true;
        continue;
      }

      const argumentValue = passedArguments[i + 1];

      // Don't forget to increase the index by more than one since we have dealth with the value already.
      i++;

      let parsedValue: any = parseFloat(argumentValue);
      if (!isNaN(parsedValue)) {
        command.arguments[argumentName] = parsedValue;
        continue;
      }

      parsedValue = argumentValue.toLowerCase();
      if (parsedValue === "true") {
        command.arguments[argumentName] = true;
        continue;
      } else if (parsedValue === "false") {
        command.arguments[argumentName] = false;
        continue;
      }

      if (command.arguments[argumentName] !== undefined && Array.isArray(command.arguments[argumentName]) === false) {
        command.arguments[argumentName] = [command.arguments[argumentName] as (string)];
      }

      if (Array.isArray(command.arguments[argumentName])) {
        (command.arguments[argumentName] as (string | number | boolean)[]).push(argumentValue);
        continue;
      }

      command.arguments[argumentName] = argumentValue;
    }

    return {
      events: [new Event<CommandEventPayload>("command", command, this.eventIdManager.generateEventId())],
      executionOrder: "sequential",
    };
  }

  supportsReverseMapping(eventResponse: EventResponse<CommandEventPayload, number>, response: any, executionContext: ExecutionContextInterface<any>): boolean {
    if (executionContext.keyname !== ExecutionContextKeynameEnum.Cli) {
      return false;
    }
    // Reverse-map only the command responses this mapper owns — the REPL-start payload
    // flows through `ReplStartEventMapper` and would otherwise be silently clobbered here.
    return eventResponse.event?.payload instanceof CommandEventPayload;
  }

  /**
   * We want to support returning an exit code directly. This means that in the cli.ts file of the customers, they can directly do:
   * process.exit(await kernel.handle(process.argv, {keyname:ExecutionContextKeynameEnum.Cli}));
   * @param eventResponse
   * @param response
   * @param executionContext
   */
  reverseMap(eventResponse: EventResponse<CommandEventPayload, number>, response: any, executionContext: ExecutionContextInterface<any>): any {
    return eventResponse.response;
  }
}