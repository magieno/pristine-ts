import "reflect-metadata"
import { injectable, injectAll } from "tsyringe";
import {ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {EventParserInterface} from "../interfaces/event-parser.interface";
import {Event} from "../models/event";
import {EventTransformError} from "../errors/event-transform.error";

/**
 * This class has all the event parsers injected. When there's an event, it will call all the Event parsers to check if
 * one supports the event and the first one that does, will be responsible for converting the raw Event into an Event
 * object.
 */
@injectable()
export class EventTransformer {
    public constructor(@injectAll(ServiceDefinitionTagEnum.EventParser) private readonly eventParsers: EventParserInterface<any>[]) {
    }

    /**
     * This method takes the raw event, loops over all the EventParsers, and converts it into an Event object.
     * @param event
     */
    transform(event: any): Event<any> {
        // Loop over the event parsers and if one supports the
        for (const eventParser of this.eventParsers) {
            if(eventParser.supports(event)) {
                return eventParser.parse(event);
            }
        }

        throw new EventTransformError("We cannot transform the raw event since no EventParser supported it.", event, this.eventParsers);
    }
}
