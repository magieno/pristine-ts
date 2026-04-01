import {Event} from "@pristine-ts/core";
import {CommandEventPayload} from "../event-payloads/command.event-payload";

export class CommandEvent extends Event<CommandEventPayload> {
}