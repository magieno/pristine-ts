import {inject, injectable, injectAll} from "tsyringe";
import {Event, EventHandlerInterface} from "@pristine-ts/core";
import {CommandEventPayload} from "../event-payloads/command.event-payload";
import {CommandEvent} from "../types/command-event.type";
import {CommandEventResponse} from "../types/command-event-response.type";
import {CommandInterface} from "../interfaces/command.interface";
import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {CommandNotFoundError} from "../errors/command-not-found.error";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {Validator} from "@pristine-ts/class-validator";
import {ConsoleManager} from "../managers/console.manager";
import {ExitCodeEnum} from "../enums/exit-code.enum";
import {CliModuleKeyname} from "../cli.module.keyname";
import {AutoDataMappingBuilderOptions, DataMapper} from "@pristine-ts/data-mapping-common";

@tag(ServiceDefinitionTagEnum.EventHandler)
@moduleScoped(CliModuleKeyname)
@injectable()
export class CliEventHandler implements EventHandlerInterface<any, any> {
  constructor(
    @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
    private readonly validator: Validator,
    private readonly consoleManager: ConsoleManager,
    private readonly dataMapper: DataMapper,
    @injectAll(ServiceDefinitionTagEnum.Command) private readonly commands: CommandInterface<any>[]) {
  }

  async handle(event: CommandEvent): Promise<CommandEventResponse> {
    // Check if a command is matched
    const command = this.commands.find(command => command.name === event.payload.name);

    if (command === undefined) {
      throw new CommandNotFoundError(event.payload.name)
    }

    let mappedArguments;

    if (event.payload.arguments !== undefined) {
      try {
        mappedArguments = await this.dataMapper.autoMap(event.payload.arguments, command.optionsType, new AutoDataMappingBuilderOptions({
          isOptionalDefaultValue: true,
          excludeExtraneousValues: false,
        }));
      } catch (e) {
        // Trying without the arguments being mapped.
        mappedArguments = event.payload.arguments;
      }
    }

    // Validates if all the conditions are respected in the expected type.
    const errors = await this.validator.validate(mappedArguments);

    if (errors.length !== 0) {
      // list the errors and return
      errors.forEach(error => {
        this.consoleManager.writeLine("Errors with argument '" + error.property + "'. The following constraints failed:");
        for (const constraint in error.constraints) {
          const message = error.constraints[constraint];
          this.consoleManager.writeLine("/t/t- [" + constraint + "]: " + message);
        }
      })

      return new CommandEventResponse(event, ExitCodeEnum.Error);
    }

    // Execute the command
    const exitCode = await command.run(
      // @ts-ignore Needs to be ignored since we know we are casting it into the expected type.
      mappedArguments
    );

    // Log the status and the command
    let status;

    switch (exitCode) {
      case ExitCodeEnum.Success:
        status = "Success";
        break;
      default:
        status = "Error";
        break;
    }

    this.consoleManager.writeLine(`[status:'${status}', code:'${exitCode}'] - Command '` + event.payload.name + "' exited.");

    process.exit(exitCode);
  }

  supports(event: Event<any>): boolean {
    return event.payload instanceof CommandEventPayload;
  }

}