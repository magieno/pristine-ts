import "reflect-metadata";
import {ExecutionContextKeynameEnum, Kernel} from "@pristine-ts/core";
import {testModule} from "../../../src/test.module";
import {HttpMethod, Request, Response} from "@pristine-ts/common";

describe("Networking - Controllers", () => {
    it("should load the controllers", async () => {
        const kernel = new Kernel();
        await kernel.start(testModule, {
            "pristine.logging.consoleLoggerActivated": false,
            "pristine.logging.fileLoggerActivated": false,
        });

        const request = new Request(HttpMethod.Put, "https://localhost:8080/api/2.0/services/0a931a57-c238-4d07-ab5e-e51b10320997", "uuid");
        request.body = {
            specialBody: "body"
        };

        const response = await kernel.handle(request, {
            keyname: ExecutionContextKeynameEnum.Jest,
            context: {}
        }) as Response;

        expect(response instanceof Response).toBeTruthy()
        expect(response.status).toBe(200);
    })

    it("should load the 'nested' controller", async () => {
        const kernel = new Kernel();
        await kernel.start(testModule, {
            "pristine.logging.consoleLoggerActivated": false,
            "pristine.logging.fileLoggerActivated": false,
        });

        let request = new Request(HttpMethod.Get, "https://localhost:8080/api/2.0/magieno/pristine", "uuid");

        let response = await kernel.handle(request, {
            keyname: ExecutionContextKeynameEnum.Jest,
            context: {}
        }) as Response;

        expect(response instanceof Response).toBeTruthy()
        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({"NestedController": true});

        request = new Request(HttpMethod.Post, "https://localhost:8080/api/2.0/magieno/pristine", "uuid");
        const body = {
            "my_body": true,
        };
        request.body = body;

        response = await kernel.handle(request, {
            keyname: ExecutionContextKeynameEnum.Jest,
            context: {}
        }) as Response;

        expect(response instanceof Response).toBeTruthy()
        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual(body);
    })

    it("should load the 'nested' controller and succeed with the id parameter", async () => {
        const kernel = new Kernel();
        await kernel.start(testModule, {
            "pristine.logging.consoleLoggerActivated": false,
            "pristine.logging.fileLoggerActivated": false,
        });

        let request = new Request(HttpMethod.Post, "https://localhost:8080/api/2.0/magieno/pristine/0123456789/registrations", "uuid");

        let response = await kernel.handle(request, {
            keyname: ExecutionContextKeynameEnum.Jest,
            context: {}
        }) as Response;

        expect(response instanceof Response).toBeTruthy()
        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual("0123456789");
    })

    it("should correctly handle different route parameters at the same level (e.g. {id} and {channelId})", async () => {
        const kernel = new Kernel();
        await kernel.start(testModule, {
            "pristine.logging.consoleLoggerActivated": false,
            "pristine.logging.fileLoggerActivated": false,
        });

        // Test the first route with {id}
        let request = new Request(HttpMethod.Get, "https://localhost:8080/api/admin/notification-channels/123", "uuid");
        let response = await kernel.handle(request, {
            keyname: ExecutionContextKeynameEnum.Jest,
            context: {}
        }) as Response;

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({ id: "123" });

        // Test the second route with {channelId}
        request = new Request(HttpMethod.Get, "https://localhost:8080/api/admin/notification-channels/456/registrations", "uuid");
        response = await kernel.handle(request, {
            keyname: ExecutionContextKeynameEnum.Jest,
            context: {}
        }) as Response;

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({ channelId: "456" });
    })
})