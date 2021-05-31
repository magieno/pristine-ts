import "reflect-metadata"
import {CoreModule, Kernel} from "@pristine-ts/core";
import {NetworkingModule} from "@pristine-ts/networking";
import {SecurityModule} from "@pristine-ts/security";
import {ModuleInterface, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {AwsModule, KafkaEventPayload} from "@pristine-ts/aws";
import {Event, EventListenerInterface, EventTransformError} from "@pristine-ts/event";



const moduleTest: ModuleInterface = {
    keyname: "Module",
    importModules: [
        CoreModule,
        AwsModule,
        NetworkingModule,
        SecurityModule,
    ]
}


describe("Handle events", () => {

    describe("Handle no parser for events", () => {
        it("should throw an error when no support for parsing the event", async () => {
            const rawEvent = {}
            const kernel = new Kernel();
            await kernel.init(moduleTest);

            let error
            try {
                await kernel.handleRawEvent(rawEvent);
            } catch (e) {
                error = e;
            }
            expect(error).toBeInstanceOf(EventTransformError);

        });
    });
    describe("Handle kafka events", () => {
        let valueToBeModified;
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

        @tag(ServiceDefinitionTagEnum.EventListener)
        class KafkaEventListener implements EventListenerInterface{
            async handle<T>(event: Event<T>): Promise<void> {
                valueToBeModified = event;
            }

            supports<T>(event: Event<T>): boolean {
                return event.payload instanceof KafkaEventPayload
            }

        }

        it("should handle a kafka event", async () => {

            const kernel = new Kernel();
            await kernel.init(moduleTest);


            const response = await kernel.handleRawEvent(rawEvent);

            const expectedEvent = {
                "payload": {
                    "eventSource": "aws:kafka",
                    "eventSourceArn": "arn:aws:kafka:us-east-1:account:cluster/vpc/uuid",
                    "topics": [
                        {
                            "records": [
                                {
                                    "offset": 15,
                                    "partition": 0,
                                    "timestamp": new Date(1596480920837),
                                    "timestampType": "CREATE_TIME",
                                    "topicName": "mytopic0",
                                    "value": "hello from kafka"
                                }
                            ]
                        },
                        {
                            "records": [
                                {
                                    "offset": 15,
                                    "partition": 0,
                                    "timestamp": new Date(1596480920837),
                                    "timestampType": "CREATE_TIME",
                                    "topicName": "mytopic1",
                                    "value": {
                                        "key": "value"
                                    }
                                }
                            ]
                        }
                    ]
                },
                "type": "KAFKA_EVENT"
            }

            expect(valueToBeModified).toEqual(expectedEvent);
        })
    });
});
