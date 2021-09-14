import "reflect-metadata"
import { injectable, injectAll, inject } from "tsyringe";
import {ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {EventParserInterface} from "../interfaces/event-parser.interface";
import {Event} from "../models/event";
import {EventTransformError} from "../errors/event-transform.error";
import {LogHandlerInterface} from "@pristine-ts/logging";

/**
 * This class has all the event parsers injected. When there's an event, it will call all the Event parsers to check if
 * one supports the event and the first one that does, will be responsible for converting the raw Event into an Event
 * object.
 */
@injectable()
export class EventTransformer {
    public constructor(@injectAll(ServiceDefinitionTagEnum.EventParser) private readonly eventParsers: EventParserInterface<any>[],
                       @inject("LogHandlerInterface") private readonly loghandler: LogHandlerInterface) {
    }

    /**
     * Verifies if the raw event is supported by at least one parser.
     * @param event
     */
    isSupported(event: any): boolean {
        this.loghandler.debug("Starting the isSupported method.", {
            event,
            eventParsers: this.eventParsers,
        })

        for (const eventParser of this.eventParsers) {
            if(eventParser.supports(event)) {
                this.loghandler.debug("Event Parser supports the event.", {
                    event,
                    eventParserName: eventParser.constructor.name,
                    eventParser: eventParser,
                })

                return true
            }

            this.loghandler.debug("Event Parser doesn't support the event.", {
                event,
                eventParserName: eventParser.constructor.name,
                eventParser: eventParser,
            })
        }

        return false;
    }

    /**
     * This method takes the raw event, loops over all the EventParsers, and converts it into an array of Event object.
     * The first parser to support it parses it.
     * @param event
     */
    transform(event: any): Event<any>[] {
        this.loghandler.debug("Starting the transform method.", {
            event,
        })

        // Loop over the event parsers and the first one that supports the event type parses the event.
        for (const eventParser of this.eventParsers) {
            if(eventParser.supports(event)) {
                const parsedEvents = eventParser.parse(event);

                this.loghandler.debug("Event Parser supports the event.", {
                    event,
                    eventParserName: eventParser.constructor.name,
                    eventParser: eventParser,
                    parsedEvents,
                });

                return parsedEvents;
            }

            this.loghandler.debug("Event Parser doesn't support the event.", {
                event,
                eventParserName: eventParser.constructor.name,
                eventParser: eventParser,
            })
        }

        throw new EventTransformError("We cannot transform the raw event since no EventParser supported it.", event, this.eventParsers);
    }
}
