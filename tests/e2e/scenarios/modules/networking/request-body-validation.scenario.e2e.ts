import "reflect-metadata"
import {injectable} from "tsyringe";
import {controller, NetworkingModule, route} from "@pristine-ts/networking";
import {bodyValidation, ValidationModule} from "@pristine-ts/validation";
import {IsInt, Max, Min} from "@pristine-ts/class-validator";
import {CoreModule, ExecutionContextKeynameEnum, Kernel} from "@pristine-ts/core";
import {HttpMethod, Request, Response} from "@pristine-ts/common";

describe("Request Body Validation", () => {

    class RequestBody {
        @IsInt()
        @Min(0)
        minimumValue: number = -1;

        @IsInt()
        @Max(10)
        maximumValue: number = 100;
    }

    @controller("/test")
    @injectable()
    class TestController {
        @route(HttpMethod.Get, "/")
        @bodyValidation(RequestBody)
        public list() {
            return {
                response: true,
            }
        }
    }

    let kernel: Kernel;

    beforeAll(async () => {
        kernel = new Kernel();
        await kernel.start({
            importServices: [],
            keyname: "pristine.validation.test",
            importModules: [
                CoreModule,
                NetworkingModule,
                ValidationModule
            ],
            providerRegistrations: []
        }, {
            "pristine.logging.consoleLoggerActivated": false,
            "pristine.logging.fileLoggerActivated": false,
        });
    })

    it("should validate the instance passed as a request body and return success when there are no validation errors", async () => {
        const request: Request = new Request(HttpMethod.Get, "http://localhost:8080/test", "uuid");
        request.body = {
            minimumValue: 10,
            maximumValue: 5,
        };

        const response = await kernel.handle(request, {keyname: ExecutionContextKeynameEnum.Jest, context: {}}) as Response;

        expect(response.status).toBe(200)
        expect(response.body.response).toBeTruthy()
    })

    it("should validate the instance passed as a request body and return a response error when there are validation errors", async () => {
        const request: Request = new Request(HttpMethod.Get, "http://localhost:8080/test", "uuid");
        request.body = {
            minimumValue: 10,
            maximumValue: 15,
        };

        const response = await kernel.handle(request, {keyname: ExecutionContextKeynameEnum.Jest, context: {}}) as Response;

        expect(response.status).toBe(400)
        expect(response.body.message).toBe("Validation error")
        expect(response.body.errors).toBeDefined()
        expect(response.body.errors.length).toBe(1)
    })
});
