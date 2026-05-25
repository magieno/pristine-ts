import {EventResponse} from "@pristine-ts/core";
import {ExitCode} from "@pristine-ts/common";
import {StartReplEventPayload} from "../event-payloads/start-repl.event-payload";

/**
 * The response shape produced by `ReplStartEventHandler` when the interactive session
 * ends (`/exit` or EOF). Carries the exit code the bin should pass to `process.exit`,
 * surfaced through `ReplStartEventMapper.reverseMap`.
 */
export class StartReplEventResponse extends EventResponse<StartReplEventPayload, ExitCode | number> {
}
