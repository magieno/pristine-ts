import "reflect-metadata"
import {Event} from "../models/event";
import {EventHandlerInterface} from "../interfaces/event-handler.interface";
import {EventDispatcher} from "./event.dispatcher";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {EventResponse} from "../models/event.response";
import {LogHandlerMock} from "../../../../tests/mocks/log.handler.mock";
import {EventListenerInterface} from "../interfaces/event-listener.interface";

describe("Event Dispatcher", () => {
    it("should transform an event by calling all the event handlers", () => {
        interface Payload {
            id: string
        }

        const eventHandler1: EventHandlerInterface<any, any> =  {
            supports(event: any): boolean {
                return true;
            },

            handle(event: Event<any>): Promise<EventResponse<any, any>> {
                return Promise.resolve(new EventResponse(event, {}));
            }
        }

        const eventHandler2: EventHandlerInterface<any, any> =  {
            supports(event: any): boolean {
                return false;
            },

            handle(event: Event<any>): Promise<EventResponse<any,any>> {
                return Promise.resolve(new EventResponse(event, {}));
            }
        }

        const eventParser1SupportsMethodSpy = jest.spyOn(eventHandler1, "supports");
        const eventParser1ParseMethodSpy = jest.spyOn(eventHandler1, "handle");
        const eventParser2SupportsMethodSpy = jest.spyOn(eventHandler2, "supports");
        const eventParser2ParseMethodSpy = jest.spyOn(eventHandler2, "handle");

        const eventDispatcher = new EventDispatcher([eventHandler2, eventHandler1], [], new LogHandlerMock());

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

    it("should dispatch to only the handler with the highest priority", async () => {
        let order = 0;

        const eventHandler1: EventHandlerInterface<any, any> = {
            priority: Number.MAX_SAFE_INTEGER,
            supports<T>(event: Event<T>): boolean {
                return true;
            },
            handle(event: Event<any>): Promise<EventResponse<any, any>> {
                order++;
                expect(order).toBe(1);
                return Promise.resolve(new EventResponse(event, {}));
            },
        };

        const eventHandler2: EventHandlerInterface<any, any> = {
            priority: 0,
            supports<T>(event: Event<T>): boolean {
                return true;
            },
            handle(event: Event<any>): Promise<EventResponse<any, any>> {
                order++;
                expect(false).toBeTruthy() // This shouldn't be called
                return Promise.resolve(new EventResponse(event, {}));
            },
        };

        const eventDispatcher = new EventDispatcher([eventHandler2, eventHandler1], [], new LogHandlerMock());

        const event: Event<any> = {
            type: "type",
            payload: {
                type: "type"
            }
        }

        await eventDispatcher.dispatch(event);

        expect.assertions(1);
    })

    it("should notify all the listeners", async() => {
        let count = 0;

        const eventListener1: EventListenerInterface = {
            execute<EventPayload>(event: Event<EventPayload>): Promise<void> {
                count++;
                return Promise.resolve()
            },
            supports<T>(event: Event<T>): boolean {
                return true;
            }
        }

        const eventListener2: EventListenerInterface = {
            execute<EventPayload>(event: Event<EventPayload>): Promise<void> {
                count++;
                return Promise.resolve()
            },
            supports<T>(event: Event<T>): boolean {
                return false;
            }
        }

        const eventListener3: EventListenerInterface = {
            execute<EventPayload>(event: Event<EventPayload>): Promise<void> {
                count++;
                return Promise.resolve()
            },
            supports<T>(event: Event<T>): boolean {
                return true;
            }
        }

        const eventDispatcher = new EventDispatcher([{
            priority: Number.MAX_SAFE_INTEGER,
            supports<T>(event: Event<T>): boolean {
                return true;
            },
            handle(event: Event<any>): Promise<EventResponse<any, any>> {
                return Promise.resolve(new EventResponse(event, {}));
            },
        }], [eventListener1, eventListener2, eventListener3], new LogHandlerMock());

        const event: Event<any> = {
            type: "type",
            payload: {
                type: "type"
            }
        }

        await eventDispatcher.dispatch(event);

        expect(count).toBe(2);
    })

    it("should throw an error if there are no handlers that support this event.", async () => {
        expect(false).toBeTruthy();
    })
    it("should throw an error if there the handler returns undefined.", async () => {
        expect(false).toBeTruthy();
    })
})
