import "reflect-metadata"
import {Event} from "../models/event";
import {EventTransformer} from "../transformers/event.transformer";
import {EventListenerInterface} from "../interfaces/event-listener.interface";
import {EventDispatcher} from "./event.dispatcher";

describe("Event Dispatcher", () => {
    it("should transform an event by calling all the event listeners", () => {
        interface Payload {
            id: string
        }

        const eventListener1: EventListenerInterface =  {
            supports(event: any): boolean {
                return true;
            },

            handle<T>(event: Event<T>): Promise<void> {
                return Promise.resolve();
            }
        }

        const eventListener2: EventListenerInterface =  {
            supports(event: any): boolean {
                return false;
            },

            handle<T>(event: Event<T>): Promise<void> {
                return Promise.resolve();
            }
        }

        const eventParser1SupportsMethodSpy = jest.spyOn(eventListener1, "supports");
        const eventParser1ParseMethodSpy = jest.spyOn(eventListener1, "handle");
        const eventParser2SupportsMethodSpy = jest.spyOn(eventListener2, "supports");
        const eventParser2ParseMethodSpy = jest.spyOn(eventListener2, "handle");

        const eventDispatcher = new EventDispatcher([eventListener2, eventListener1]);

        const event: Event<any> = {
            type: "type",
            payload: {
                type: "type"
            }
        }

        eventDispatcher.dispatch(event);

        expect(eventParser1SupportsMethodSpy).toHaveBeenCalledTimes(1);
        expect(eventParser1ParseMethodSpy).toHaveBeenCalledTimes(1);
        expect(eventParser2SupportsMethodSpy).toHaveBeenCalledTimes(1);
        expect(eventParser2ParseMethodSpy).toHaveBeenCalledTimes(0);
    })
})