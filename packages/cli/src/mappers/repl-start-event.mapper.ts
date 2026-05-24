import {
  Event,
  EventMapperInterface,
  EventResponse,
  EventsExecutionOptionsInterface,
  ExecutionContextInterface,
  ExecutionContextKeynameEnum,
} from "@pristine-ts/core";
import {injectable} from "tsyringe";
import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {v4 as uuidv4} from "uuid";
import {StartReplEventPayload} from "../event-payloads/start-repl.event-payload";
import {CliModuleKeyname} from "../cli.module.keyname";
import {PristineArgv} from "../utils/pristine-argv";

/**
 * Maps the "no command" / `repl` argv shapes onto a `StartReplEventPayload` so the kernel
 * can dispatch the REPL launch through the normal event pipeline — `cli.ts` just calls
 * `kernel.handle(process.argv, {keyname: Cli})` regardless of whether the user invoked
 * `pristine`, `pristine repl`, or `pristine <some-command>`.
 *
 * Argv parsing is delegated to `PristineArgv`, which scans for the bin token rather than
 * assuming positional layout — so the rule is runtime-agnostic and survives launchers
 * that shape argv differently.
 *
 * `CommandEventMapper` explicitly excludes these same shapes from its own
 * `supportsMapping` so the two mappers partition argv space cleanly — no shape is claimed
 * by both.
 */
@tag(ServiceDefinitionTagEnum.EventMapper)
@moduleScoped(CliModuleKeyname)
@injectable()
export class ReplStartEventMapper implements EventMapperInterface<StartReplEventPayload, number> {
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
    // No user args → REPL. First user arg is `repl` → REPL (any tokens after `repl` are
    // ignored at routing time, by design).
    return argv.userArgs.length === 0 || argv.userArgs[0] === "repl";
  }

  map(rawEvent: any, executionContext: ExecutionContextInterface<any>): EventsExecutionOptionsInterface<StartReplEventPayload> {
    const argv = new PristineArgv(Array.isArray(rawEvent) ? rawEvent : []);
    const payload = new StartReplEventPayload(argv.scriptPath);
    return {
      events: [new Event<StartReplEventPayload>("start-repl", payload, uuidv4())],
      executionOrder: "sequential",
    };
  }

  supportsReverseMapping(eventResponse: EventResponse<StartReplEventPayload, number>, response: any, executionContext: ExecutionContextInterface<any>): boolean {
    return executionContext.keyname === ExecutionContextKeynameEnum.Cli
      && eventResponse.event?.payload instanceof StartReplEventPayload;
  }

  /**
   * The REPL handler resolves with the session's exit code; surface it as-is so
   * `Cli.bootstrap()` can return it to the bin (which calls `process.exit`).
   */
  reverseMap(eventResponse: EventResponse<StartReplEventPayload, number>, response: any, executionContext: ExecutionContextInterface<any>): any {
    return eventResponse.response;
  }
}
