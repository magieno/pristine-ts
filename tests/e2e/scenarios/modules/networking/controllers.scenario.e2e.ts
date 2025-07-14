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
})