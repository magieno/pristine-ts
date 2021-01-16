import {EventTransformer} from "./event.transformer";
import {EventParserInterface} from "../interfaces/event-parser.interface";
import {Event} from "../models/event";


describe("Event Transformer", () => {
    it("should transform an event by calling the event parsers", () => {
        interface Payload {
            id: string
        }


        const eventParser1: EventParserInterface<Payload> =  {
            supports(event: any): boolean {
                return true;
            },

            parse(event: any): Event<Payload> {
                return {
                    payload: {
                        id: "identifier"
                    },
                    type: "type",
                }
            }
        }

        const eventParser2: EventParserInterface<Payload> =  {
            supports(event: any): boolean {
                return false;
            },

            parse(event: any): Event<Payload> {
                return {
                    payload: {
                        id: "identifier2"
                    },
                    type: "type2",
                }
            }
        }

        const eventParser1SupportsMethodSpy = jest.spyOn(eventParser1, "supports");
        const eventParser1ParseMethodSpy = jest.spyOn(eventParser1, "parse");
        const eventParser2SupportsMethodSpy = jest.spyOn(eventParser2, "supports");
        const eventParser2ParseMethodSpy = jest.spyOn(eventParser2, "parse");

        const eventTransformer = new EventTransformer([eventParser2, eventParser1]);

        const event = eventTransformer.transform({
            "type": "arn",
            "arn": "amazon_arn",
        })

        expect(eventParser1SupportsMethodSpy).toHaveBeenCalledTimes(1);
        expect(eventParser1ParseMethodSpy).toHaveBeenCalledTimes(1);
        expect(eventParser2SupportsMethodSpy).toHaveBeenCalledTimes(1);
        expect(eventParser2ParseMethodSpy).toHaveBeenCalledTimes(0);
    })
})