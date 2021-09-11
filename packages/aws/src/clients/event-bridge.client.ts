import {inject, injectable} from "tsyringe";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {EventBridgePayload} from "../event-payloads/event-bridge.payload";
import {EventBridgeClient as AwsEventBridgeClient, PutEventsCommand} from "@aws-sdk/client-eventbridge";
import {EventBridgeMessageModel} from "../models/event-bridge-message.model";
import {PutEventsRequestEntry} from "@aws-sdk/client-eventbridge/models/models_0";
import {SqsSendMessageError} from "../errors/sqs-send-message.error";
import {EventBridgeSendMessageError} from "../errors/event-bridge-send-message.error";

@injectable()
export class EventBridgeClient {
    constructor(
        @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
        @inject("%pristine.aws.region%") private readonly region: string,
    ) {
    }

    send(eventBridgeMessages: EventBridgeMessageModel | EventBridgeMessageModel[], eventBusName: string, endpoint?: string): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            try {

                const client = new AwsEventBridgeClient({
                    apiVersion: "2015-10-17",
                    region: this.region,
                    endpoint: endpoint ?? undefined,
                })

                const putEventsCommand: PutEventsCommand = new PutEventsCommand({
                    Entries: []
                });

                this.logHandler.debug("Sending a message to the EventBridge", {
                    eventBridgeMessages,
                    eventBusName,
                    endpoint,
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

                const response = await client.send(putEventsCommand);

                this.logHandler.debug("Message succesfully sent to the EventBridge", {
                    eventBridgeMessages,
                    eventBusName,
                    endpoint,
                    response,
                })

                return resolve();
            } catch (error) {
                this.logHandler.error("There was an error sending the message to the Event Bus", {
                    error,
                    eventBridgeMessages,
                    eventBusName,
                    endpoint,
                });

                return reject(new EventBridgeSendMessageError(error));
            }
        });
    }
}
