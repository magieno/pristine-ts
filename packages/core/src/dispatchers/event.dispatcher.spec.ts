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

        const eventHandler1: EventHandlerInterface =  {
            supports(event: any): boolean {
                return true;
            },

            handle<T, R>(event: Event<T>, eventResponse: EventResponse<T, R>): Promise<EventResponse<T, R>> {
                return Promise.resolve(eventResponse);
            }
        }

        const eventHandler2: EventHandlerInterface =  {
            supports(event: any): boolean {
                return false;
            },

            handle<T, R>(event: Event<T>, eventResponse: EventResponse<T, R>): Promise<EventResponse<T, R>> {
                return Promise.resolve(eventResponse);
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

    it("should dispatch all the handlers in order of priority", async () => {
        let order = 0;

        const eventHandler1: EventHandlerInterface = {
            priority: Number.MAX_SAFE_INTEGER,
            supports<T>(event: Event<T>): boolean {
                return true;
            },
            handle<T, R>(event: Event<T>, eventResponse: EventResponse<T, R>): Promise<EventResponse<T, R>> {
                order++;
                expect(order).toBe(1);
                return Promise.resolve(eventResponse);
            },
        };

        const eventHandler2: EventHandlerInterface = {
            priority: 0,
            supports<T>(event: Event<T>): boolean {
                return true;
            },
            handle<T, R>(event: Event<T>, eventResponse: EventResponse<T, R>): Promise<EventResponse<T, R>> {
                order++;
                expect(order).toBe(2);
                return Promise.resolve(eventResponse);
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

        expect.assertions(2);
    })

    it("should notify all the listeners", async() => {
        let count = 0;

        const eventListener1: EventListenerInterface = {
            handle<EventPayload>(event: Event<EventPayload>): Promise<void> {
                count++;
                return Promise.resolve()
            },
            supports<T>(event: Event<T>): boolean {
                return true;
            }
        }

        const eventListener2: EventListenerInterface = {
            handle<EventPayload>(event: Event<EventPayload>): Promise<void> {
                count++;
                return Promise.resolve()
            },
            supports<T>(event: Event<T>): boolean {
                return false;
            }
        }

        const eventListener3: EventListenerInterface = {
            handle<EventPayload>(event: Event<EventPayload>): Promise<void> {
                count++;
                return Promise.resolve()
            },
            supports<T>(event: Event<T>): boolean {
                return true;
            }
        }

        const eventDispatcher = new EventDispatcher([], [eventListener1, eventListener2, eventListener3], new LogHandlerMock());

        const event: Event<any> = {
            type: "type",
            payload: {
                type: "type"
            }
        }

        await eventDispatcher.dispatch(event);

        expect(count).toBe(2);
    })
})
