import "reflect-metadata"
import {Event} from "../models/event";
import {EventListenerInterface} from "../interfaces/event-listener.interface";
import {EventDispatcher} from "./event.dispatcher";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {EventResponse} from "../models/event.response";
import {LogHandlerMock} from "../../../../tests/mocks/log.handler.mock";

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

        const eventDispatcher = new EventDispatcher([eventListener2, eventListener1], new LogHandlerMock());

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

    it("should dispatch all the listeners in order of priority", async () => {
        let order = 0;

        const eventListener1: EventListenerInterface = {
            priority: Number.MAX_SAFE_INTEGER,
            supports<T>(event: Event<T>): boolean {
                return true;
            },
            handle<T, R>(event: Event<T>, eventResponse: EventResponse<T, R>): Promise<void> {
                order++;
                expect(order).toBe(1);
                return Promise.resolve();
            },
        };

        const eventListener2: EventListenerInterface = {
            priority: 0,
            supports<T>(event: Event<T>): boolean {
                return true;
            },
            handle<T, R>(event: Event<T>, eventResponse: EventResponse<T, R>): Promise<void> {
                order++;
                expect(order).toBe(2);
                return Promise.resolve();
            },
        };

        const eventDispatcher = new EventDispatcher([eventListener2, eventListener1], new LogHandlerMock());

        const event: Event<any> = {
            type: "type",
            payload: {
                type: "type"
            }
        }

        await eventDispatcher.dispatch(event);

        expect.assertions(2);
    })
})
