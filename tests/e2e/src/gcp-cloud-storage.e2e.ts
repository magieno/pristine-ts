import "reflect-metadata";
import {container} from "tsyringe";
import {EventIdGenerationStyleEnum, EventIdManager, ExecutionContextKeynameEnum} from "@pristine-ts/core";
import {CloudStorageEventMapper, CloudStorageEventPayload, CloudStorageEventType} from "@pristine-ts/gcp";
import * as path from "path";
import * as fs from "fs";

const fixture = (name: string) => JSON.parse(fs.readFileSync(path.join(__dirname, "..", "files", "gcp", name), "utf-8"));

describe("GCP Cloud Storage event mapper (E2E)", () => {
    beforeEach(() => container.clearInstances());

    it("supportsMapping returns true for a Cloud Storage CloudEvent", () => {
        const mapper = new CloudStorageEventMapper(new EventIdManager(EventIdGenerationStyleEnum.Uuid));
        expect(mapper.supportsMapping(fixture("cloud-storage-finalized.cloudevent.json"), {} as any)).toBe(true);
        expect(mapper.supportsMapping(fixture("cloud-storage-deleted.cloudevent.json"), {} as any)).toBe(true);
    });

    it("supportsMapping returns false for unrelated CloudEvents", () => {
        const mapper = new CloudStorageEventMapper(new EventIdManager(EventIdGenerationStyleEnum.Uuid));
        expect(mapper.supportsMapping(fixture("firestore-created.cloudevent.json"), {} as any)).toBe(false);
        expect(mapper.supportsMapping(fixture("eventarc-generic.cloudevent.json"), {} as any)).toBe(false);
    });

    it("map extracts bucket, name, type-enum, and parses time", () => {
        const mapper = new CloudStorageEventMapper(new EventIdManager(EventIdGenerationStyleEnum.Uuid));
        const result = mapper.map(fixture("cloud-storage-finalized.cloudevent.json"), {} as any);
        const event = result.events[0];
        expect(event.type).toBe(CloudStorageEventType.ObjectFinalized);
        const payload = event.payload as CloudStorageEventPayload;
        expect(payload.bucket).toBe("test-bucket");
        expect(payload.name).toBe("path/to/file.txt");
        expect(payload.contentType).toBe("text/plain");
        expect(payload.size).toBe("42");
        expect(payload.eventTime).toBeInstanceOf(Date);
    });

    it("map maps the Deleted enum value", () => {
        const mapper = new CloudStorageEventMapper(new EventIdManager(EventIdGenerationStyleEnum.Uuid));
        const result = mapper.map(fixture("cloud-storage-deleted.cloudevent.json"), {} as any);
        expect(result.events[0].type).toBe(CloudStorageEventType.ObjectDeleted);
    });
});
