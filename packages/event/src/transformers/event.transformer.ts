import "reflect-metadata"
import { injectable, injectAll } from "tsyringe";
import {ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {EventParserInterface} from "../interfaces/event-parser.interface";
import {Event} from "../models/event";
import {EventTransformError} from "../errors/event-transform.error";

@injectable()
export class EventTransformer {
    public constructor(@injectAll(ServiceDefinitionTagEnum.EventParser) private readonly eventParsers: EventParserInterface<any>[]) {
    }

    transform(event: any): Event<any> {
        // Loop over the event parsers and if one supports the
        for (const eventParser of this.eventParsers) {
            if(eventParser.supports(event)) {
                return eventParser.parse(event);
            }
        }

        throw new EventTransformError("We cannot transform the raw event since no EventParser supported it.");
    }
}