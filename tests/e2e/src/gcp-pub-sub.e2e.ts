import "reflect-metadata";
import {container} from "tsyringe";
import {EventIdGenerationStyleEnum, EventIdManager, ExecutionContextKeynameEnum} from "@pristine-ts/core";
import {PubSubEventMapper, PubSubEventPayload, PubSubEventType} from "@pristine-ts/gcp";
import * as path from "path";
import * as fs from "fs";

const fixture = (name: string) => JSON.parse(fs.readFileSync(path.join(__dirname, "..", "files", "gcp", name), "utf-8"));

describe("GCP Pub/Sub event mapper (E2E)", () => {
    beforeEach(() => container.clearInstances());

    it("supportsMapping returns true for a Pub/Sub push delivery", () => {
        const mapper = new PubSubEventMapper(new EventIdManager(EventIdGenerationStyleEnum.Uuid));
        const raw = fixture("pub-sub-push.json");
        expect(mapper.supportsMapping(raw, {keyname: ExecutionContextKeynameEnum.GcpCloudFunction, context: {}} as any)).toBe(true);
    });

    it("supportsMapping returns false for non-Pub/Sub shapes", () => {
        const mapper = new PubSubEventMapper(new EventIdManager(EventIdGenerationStyleEnum.Uuid));
        expect(mapper.supportsMapping({type: "google.cloud.storage.object.v1.finalized", source: "x"}, {keyname: ExecutionContextKeynameEnum.GcpCloudFunction, context: {}} as any)).toBe(false);
        expect(mapper.supportsMapping({Records: []}, {keyname: ExecutionContextKeynameEnum.AwsLambda, context: {}} as any)).toBe(false);
    });

    it("map decodes base64 data, attributes, subscription", () => {
        const mapper = new PubSubEventMapper(new EventIdManager(EventIdGenerationStyleEnum.Uuid));
        const result = mapper.map(fixture("pub-sub-push.json"), {keyname: ExecutionContextKeynameEnum.GcpCloudFunction, context: {}} as any);
        expect(result.events).toHaveLength(1);
        const event = result.events[0];
        expect(event.type).toBe(PubSubEventType.Message);
        const payload = event.payload as PubSubEventPayload;
        expect(payload.messageId).toBe("test-msg-1");
        expect(payload.body).toBe(JSON.stringify({hello: "world"}));
        expect(payload.attributes.source).toBe("test");
        expect(payload.subscription).toBe("projects/test-project/subscriptions/test-sub");
        expect(payload.publishTime).toBeInstanceOf(Date);
    });
});
