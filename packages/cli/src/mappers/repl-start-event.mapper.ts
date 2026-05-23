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

/**
 * Maps the "no command" / `repl` argv shapes onto a `StartReplEventPayload` so the kernel
 * can dispatch the REPL launch through the normal event pipeline — `cli.ts` just calls
 * `kernel.handle(process.argv, {keyname: Cli})` regardless of whether the user invoked
 * `pristine`, `pristine repl`, or `pristine <some-command>`. The matching keyname for the
 * outer launch is `Cli` (it's still a CLI process invocation that happens to have no
 * explicit command); the `Repl` keyname is for the inner per-line dispatches the REPL
 * handler issues after the session has started.
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
    // `[node, pristine]` (no command) → REPL.
    if (rawEvent.length <= 2) {
      return true;
    }
    // `[node, pristine, repl, ...]` (explicit `repl` command) → REPL.
    return rawEvent[2] === "repl";
  }

  map(rawEvent: any, executionContext: ExecutionContextInterface<any>): EventsExecutionOptionsInterface<StartReplEventPayload> {
    const scriptPath = Array.isArray(rawEvent) && typeof rawEvent[1] === "string" ? rawEvent[1] : "";
    const payload = new StartReplEventPayload(scriptPath);
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
