import "reflect-metadata"
import {
    CoreModule,
    Event, EventHandlerInterface,
    EventListenerInterface,
    EventMappingError, EventResponse,
    ExecutionContextKeynameEnum,
    Kernel
} from "@pristine-ts/core";
import {NetworkingModule} from "@pristine-ts/networking";
import {SecurityModule} from "@pristine-ts/security";
import {AppModuleInterface, ModuleInterface, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {AwsModule, KafkaEventPayload, KafkaEventType} from "@pristine-ts/aws";
import {injectable} from 'tsyringe';

const moduleTest: AppModuleInterface = {
    keyname: "Module",
    importModules: [
        CoreModule,
        AwsModule,
        NetworkingModule,
        SecurityModule,
    ],
    importServices: [],
}


describe("Handle events", () => {

    describe("Handle no mappers for events", () => {
        it("should throw an error when no support for mapping the event", async () => {
            const rawEvent = {}
            const kernel = new Kernel();
            await kernel.start(moduleTest, {
                "pristine.logging.consoleLoggerActivated": false,
                "pristine.logging.fileLoggerActivated": false,
            });

            let error
            try {
                await kernel.handle(rawEvent, {keyname: ExecutionContextKeynameEnum.AwsLambda, context: undefined});
            } catch (e) {
                error = e;
            }
            expect(error).toBeInstanceOf(EventMappingError);

        });
    });
    describe("Handle kafka events", () => {
        let valuesToBeModified: any[] = [];
        const rawEvent = {
            "eventSource": "aws:kafka",
            "eventSourceArn": "arn:aws:kafka:us-east-1:account:cluster/vpc/uuid",
            "records": {
                "mytopic-0": [
                    {
                        "topic": "mytopic0",
                        partition: 0,
                        offset: 15,
                        timestamp: 1596480920837,
                        timestampType: "CREATE_TIME",
                        value: "aGVsbG8gZnJvbSBrYWZrYQ=="
                    }
                ],
                "mytopic-1": [
                    {
                        "topic": "mytopic1",
                        partition: 0,
                        offset: 15,
                        timestamp: 1596480920837,
                        timestampType: "CREATE_TIME",
                        value: "ewoia2V5IjogInZhbHVlIgp9Cg=="
                    }
                ]
            }
        };

        @tag(ServiceDefinitionTagEnum.EventHandler)
        @injectable()
        class KafkaEventHandler implements EventHandlerInterface<any, any> {

            supports<T>(event: Event<T>): boolean {
                return event.payload instanceof KafkaEventPayload
            }

            async handle(event: Event<any>): Promise<EventResponse<any, any>> {
                valuesToBeModified.push(event);
                return new EventResponse(event, {});
            }
        }

        it("should handle a kafka event", async () => {

            const kernel = new Kernel();
            await kernel.start(moduleTest, {
                "pristine.logging.consoleLoggerActivated": false,
                "pristine.logging.fileLoggerActivated": false,
            });


            const response = await kernel.handle(rawEvent, {keyname: ExecutionContextKeynameEnum.AwsLambda, context: undefined});

            const kafkaEvent1: Event<KafkaEventPayload> = {
                type: KafkaEventType.KafkaEvent,
                id: "kafka",
                payload: {
                    eventSource: "aws:kafka",
                    eventSourceArn: "arn:aws:kafka:us-east-1:account:cluster/vpc/uuid",
                    topicName: "mytopic0",
                    messages: [
                        {
                            offset: 15,
                            partition: 0,
                            timestamp: new Date(1596480920837),
                            timestampType: "CREATE_TIME",
                            value: "hello from kafka"
                        }
                    ]
                }
            };

            const kafkaEvent2: Event<KafkaEventPayload> = {
                type: KafkaEventType.KafkaEvent,
                id: "kafka",
                payload: {
                    eventSource: "aws:kafka",
                    eventSourceArn: "arn:aws:kafka:us-east-1:account:cluster/vpc/uuid",
                    topicName: "mytopic1",
                    messages: [
                        {
                            offset: 15,
                            partition: 0,
                            timestamp: new Date(1596480920837),
                            timestampType: "CREATE_TIME",
                            value: {
                                key: "value"
                            }
                        }
                    ]
                }
            };

            expect(valuesToBeModified).toEqual([kafkaEvent1, kafkaEvent2]);
        })
    });
});
