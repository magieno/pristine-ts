import {EventResponse} from "@pristine-ts/core";
import {ExitCode} from "@pristine-ts/common";
import {CommandEventPayload} from "../event-payloads/command.event-payload";

export class CommandEventResponse extends EventResponse<CommandEventPayload, ExitCode | number> {
}
