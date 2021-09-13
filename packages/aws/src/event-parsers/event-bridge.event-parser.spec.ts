import "reflect-metadata"
import {Event} from "@pristine-ts/event";
import {SqsEventParser} from "./sqs.event-parser";
import {SqsEventType} from "../enums/sqs-event-type.enum";
import {SqsEventPayload} from "../event-payloads/sqs.event-payload";
import {EventBridgeEventParser} from "./event-bridge.event-parser";
import {EventBridgePayload} from "../event-payloads/event-bridge.payload";
import {EventBridgeEventTypeEnum} from "../enums/event-bridge-event-type.enum";

describe("Event Bridge event parser", () => {
    //https://docs.aws.amazon.com/lambda/latest/dg/with-sqs.html
    const rawEvent = {
        version: '0',
        id: '63f83c49-95f4-122c-0d0e-f4c2fe052ac6',
        'detail-type': 'Normal Event',
        source: 'my.own.custom.source',
        account: '151354380905',
        time: '2021-09-13T19:10:20Z',
        region: 'us-east-2',
        resources: [
            'arn:aws:events:us-east-2:151354380905:rule/bi-tool-event-bridge-ScheduledRule-PB81DWGAWOLD'
        ],
        detail: {}
    };

    const scheduledRawEvent = {
        version: '0',
        id: '63f83c49-95f4-122c-0d0e-f4c2fe052ac6',
        'detail-type': 'Scheduled Event',
        source: 'aws.events',
        account: '151354380905',
        time: '2021-09-13T19:10:20Z',
        region: 'us-east-2',
        resources: [
        'arn:aws:events:us-east-2:151354380905:rule/bi-tool-event-bridge-ScheduledRule-PB81DWGAWOLD'
    ],
        detail: {}
    };

    it("should support an event from Event Bridge", () => {
        const eventBridgeEventParser = new EventBridgeEventParser();

        expect(eventBridgeEventParser.supports(rawEvent)).toBeTruthy();
    });

    it("should support a scheduled event from Event Bridge", () => {
        const eventBridgeEventParser = new EventBridgeEventParser();

        expect(eventBridgeEventParser.supports(scheduledRawEvent)).toBeTruthy();
    });

    it("should transform a scheduled event bridged from Event Bridge", () => {

        const eventBridgeEventParser = new EventBridgeEventParser();

        const eventBridgePayloadEvent: Event<EventBridgePayload> = {
            type: EventBridgeEventTypeEnum.Event,
            payload: {
                version: '0',
                id: '63f83c49-95f4-122c-0d0e-f4c2fe052ac6',
                detailType: 'Normal Event',
                source: 'my.own.custom.source',
                account: '151354380905',
                time: '2021-09-13T19:10:20Z',
                region: 'us-east-2',
                resources: [
                    'arn:aws:events:us-east-2:151354380905:rule/bi-tool-event-bridge-ScheduledRule-PB81DWGAWOLD'
                ],
                detail: {},
            }
        }
        expect(eventBridgeEventParser.parse(rawEvent)).toEqual([eventBridgePayloadEvent]);
    })

    it("should transform a scheduled event bridged from Event Bridge", () => {

        const eventBridgeEventParser = new EventBridgeEventParser();

        const eventBridgePayloadEvent: Event<EventBridgePayload> = {
            type: EventBridgeEventTypeEnum.ScheduledEvent,
            payload: {
                version: '0',
                id: '63f83c49-95f4-122c-0d0e-f4c2fe052ac6',
                detailType: 'Scheduled Event',
                source: 'aws.events',
                account: '151354380905',
                time: '2021-09-13T19:10:20Z',
                region: 'us-east-2',
                resources: [
                    'arn:aws:events:us-east-2:151354380905:rule/bi-tool-event-bridge-ScheduledRule-PB81DWGAWOLD'
                ],
                detail: {},
            }
        }
        expect(eventBridgeEventParser.parse(scheduledRawEvent)).toEqual([eventBridgePayloadEvent]);
    })
})
