import {inject, injectable} from "tsyringe";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {EventBridgeClient as AwsEventBridgeClient, PutEventsCommand} from "@aws-sdk/client-eventbridge";
import {EventBridgeMessageModel} from "../models/event-bridge-message.model";
import {EventBridgeSendMessageError} from "../errors/event-bridge-send-message.error";
import {EventBridgeClientInterface} from "../interfaces/event-bridge-client.interface";
import {moduleScoped, tag} from "@pristine-ts/common";
import {AwsModuleKeyname} from "../aws.module.keyname";
import {ClientOptionsInterface} from "../interfaces/client-options.interface";

/**
 * The client to use to interact with AWS Event Bridge. It is a wrapper around the AwsEventBridgeClient of @aws-sdk/client-eventbridge.
 * It is tagged so it can be injected using EventBridgeClientInterface.
 */
@tag("EventBridgeClientInterface")
@moduleScoped(AwsModuleKeyname)
@injectable()
export class EventBridgeClient implements EventBridgeClientInterface {

    /**
     * The client to use to interact with AWS Event Bridge. It is a wrapper around the AwsEventBridgeClient of @aws-sdk/client-eventbridge.
     * @param logHandler The log handler used to output logs.
     * @param region The aws region for which the client will be used.
     */
    constructor(
        @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
        @inject("%pristine.aws.region%") private readonly region: string,
    ) {
    }

    /**
     * Returns the instantiated AwsEventBridgeClient from the @aws-sdk/client-eventbridge library.
     * @param endpoint The endpoint for which the Event Bridge client is created.
     */
    public getClient(endpoint?: string): AwsEventBridgeClient {
        return new AwsEventBridgeClient({
            apiVersion: "2015-10-17",
            region: this.region,
            endpoint: endpoint ?? undefined,
        });
    }

    /**
     * Sends an event to event bridge.
     * @param eventBridgeMessages The messages to send to event bridge.
     * @param eventBusName The event bus name where to send the messages.
     * @param options
     * @param endpoint The endpoint for event bridge.
     */
    async send(eventBridgeMessages: EventBridgeMessageModel | EventBridgeMessageModel[], eventBusName: string, endpoint?: string, options?: Partial<ClientOptionsInterface>): Promise<void> {
        try {
            const client = this.getClient(endpoint);

            const putEventsCommand: PutEventsCommand = new PutEventsCommand({
                Entries: []
            });

            this.logHandler.debug("EventBridgeClient: Sending a message to the EventBridge.", {
                extra: {
                    eventBridgeMessages,
                    eventBusName,
                    endpoint,
                }
            })

            if (Array.isArray(eventBridgeMessages)) {
                putEventsCommand.input.Entries = eventBridgeMessages.map(eventBridgeMessage => {
                    return {
                        EventBusName: eventBusName,
                        Source: eventBridgeMessage.source,
                        DetailType: eventBridgeMessage.detailType,
                        Detail: eventBridgeMessage.detail,
                        Resources: eventBridgeMessage.resources,
                    }
                });
            } else {
                putEventsCommand.input.Entries = [{
                    EventBusName: eventBusName,
                    Source: eventBridgeMessages.source,
                    DetailType: eventBridgeMessages.detailType,
                    Detail: eventBridgeMessages.detail,
                    Resources: eventBridgeMessages.resources,
                }]
            }

            const response = await client.send(putEventsCommand, options);

            this.logHandler.debug("EventBridgeClient: Message successfully sent to the EventBridge.", {
                extra: {
                    eventBridgeMessages,
                    eventBusName,
                    endpoint,
                    response,
                }
            })
        } catch (error) {
            this.logHandler.error("EventBridgeClient: There was an error sending the message to the Event Bus.", {
                extra: {
                    error,
                    eventBridgeMessages,
                    eventBusName,
                    endpoint,
                }
            });

            throw new EventBridgeSendMessageError(error);
        }
    }
}
