import {EventBridgeMessageModel} from "../models/event-bridge-message.model";
import {EventBridgeClient as AwsEventBridgeClient} from "@aws-sdk/client-eventbridge";
import {ClientOptionsInterface} from "./client-options.interface";

/**
 * The EventBridgeClient Interface defines the methods that an Event bridge client must implement.
 * When injecting the event bridge client the 'EventBridgeClientInterface' tag should be used.
 */
export interface EventBridgeClientInterface {
    /**
     * Returns the instantiated AwsEventBridgeClient from the @aws-sdk/client-eventbridge library.
     * @param endpoint The endpoint for which the Event Bridge client is created.
     */
    getClient(endpoint?: string): AwsEventBridgeClient

    /**
     * Sends an event to event bridge.
     * @param eventBridgeMessages The messages to send to event bridge.
     * @param eventBusName The event bus name where to send the messages.
     * @param endpoint The endpoint for event bridge.
     * @param options
     */
    send(eventBridgeMessages: EventBridgeMessageModel | EventBridgeMessageModel[], eventBusName: string, endpoint?: string, options?: Partial<ClientOptionsInterface>): Promise<void>;
}
