import {EventResponse} from "@pristine-ts/core";
import {CommandEventPayload} from "../event-payloads/command.event-payload";
import {ExitCodeEnum} from "../enums/exit-code.enum";

export class CommandEventResponse extends EventResponse<CommandEventPayload, ExitCodeEnum | number> {
}