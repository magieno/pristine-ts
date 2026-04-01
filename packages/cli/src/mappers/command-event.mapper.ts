import {
  Event,
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
import {v4 as uuidv4} from "uuid";

@tag(ServiceDefinitionTagEnum.EventMapper)
@moduleScoped(CliModuleKeyname)
@injectable()
export class CommandEventMapper implements EventMapperInterface<CommandEventPayload, number> {
  supportsMapping(rawEvent: any, executionContext: ExecutionContextInterface<any>): boolean {
    return executionContext.keyname === ExecutionContextKeynameEnum.Cli;
  }

  /**
   * Inspired from: https://github.com/eveningkid/args-parser
   * @param rawEvent
   * @param executionContext
   */
  map(rawEvent: any, executionContext: ExecutionContextInterface<any>): EventsExecutionOptionsInterface<CommandEventPayload> {
    if (Array.isArray(rawEvent) === false) {
      throw new Error("If using the 'CLI', process.argv should be passed as the event.");
    }

    if (rawEvent.length < 3) {
      throw new Error("If using the 'CLI', there must be at least one command passed");
    }
    const command = new CommandEventPayload(rawEvent[2], rawEvent[1]);

    // if argument starts with - or --, then there is two options. Either there's an equal sign in the string and after the equal sign is the value or the next argument is actually the value
    // for the value, we need to check if it can be a boolean and if not, if it can be a number. If yes, they should be transformed. Else, the value should be a string.
    // If the argument doesn't start with --, then it's value is simply the true boolean
    const passedArguments = rawEvent.slice(3);
    for (let i = 0; i < passedArguments.length; i++) {
      const arg: string = passedArguments[i];
      if (arg.startsWith("-") === false) {
        command.arguments[arg] = true;
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
      events: [new Event<CommandEventPayload>("command", command, uuidv4())],
      executionOrder: "sequential",
    };
  }

  supportsReverseMapping(eventResponse: EventResponse<CommandEventPayload, number>, response: any, executionContext: ExecutionContextInterface<any>): boolean {
    return executionContext.keyname === ExecutionContextKeynameEnum.Cli;
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