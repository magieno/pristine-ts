import "reflect-metadata";
import {testModule} from "../test.module";
import {TestGuard} from "./test.guard";
import {PermissionManager} from "../managers/permission.manager";
import {container, DependencyContainer, inject, injectable, singleton} from "tsyringe";


import {
    ForbiddenHttpError,
    controllerRegistry,
    controller,
    body,
    routeParameter,
    route,
} from "@pristine-ts/networking";
import {
    Kernel,
} from "@pristine-ts/core";
import {guard} from "@pristine-ts/security";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/2.0/guards")
@singleton()
@guard(TestGuard)
export class TestGuardsController {
    constructor(private readonly permissionManager: PermissionManager) {
    }

    @route(HttpMethod.Get, "/services")
    public list() {
        const a = 0;
    }

    @route(HttpMethod.Post, "/services")
    public add(@body() body: any) {

    }

    @route(HttpMethod.Put, "/services/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
        const a  = 0;
    }
}

describe("Guards", () => {
    beforeEach(async () => {
        // Very import to clear the instances in between executions.
        container.clearInstances();
    })

    it("should return a 200 response when all the guards returns true in its isAuthorized method", async () => {
        const kernel = new Kernel();

        const testModuleCopied = {
            ...testModule,
        }

        testModuleCopied.importServices.push(TestGuardsController);
        testModuleCopied.providerRegistrations?.push({
            token: TestGuard,
            useValue: new TestGuard(true),
        })

        await kernel.init(testModuleCopied);

        const response = await kernel.handleRequest({
            url: "https://localhost:8080/api/2.0/guards/services/0a931a57-c238-4d07-ab5e-e51b10320997",
            httpMethod: HttpMethod.Put,
            body: {
                specialBody: "body"
            }
        });

        expect(response.status).toBe(200);
    })

    it("should return a 403 forbidden exception when one of the guards returns false in its isAuthorized method", async () => {
        const kernel = new Kernel();

        const testModuleCopied = {
            ...testModule,
        }

        testModuleCopied.importServices.push(TestGuardsController);
        testModuleCopied.providerRegistrations?.push({
            token: TestGuard,
            useValue: new TestGuard(false),
        })

        await kernel.init(testModuleCopied);

        const response = await kernel.handleRequest({
            url: "https://localhost:8080/api/2.0/guards/services/0a931a57-c238-4d07-ab5e-e51b10320997",
            httpMethod: HttpMethod.Put,
            body: {
                specialBody: "body"
            }
        });

        expect(response.status).toBe(403);
    })

    it("should return a 403 forbidden exception when one of the guards throws an error", async () => {
        const kernel = new Kernel();

        const testModuleCopied = {
            ...testModule,
        }

        const testGuard = new TestGuard(false);
        testGuard.isAuthorized = () => {
            throw new Error();
        }

        testModuleCopied.importServices.push(TestGuardsController);
        testModuleCopied.providerRegistrations?.push({
            token: TestGuard,
            useValue: testGuard,
        })

        await kernel.init(testModuleCopied);

        const response = await kernel.handleRequest({
            url: "https://localhost:8080/api/2.0/guards/services/0a931a57-c238-4d07-ab5e-e51b10320997",
            httpMethod: HttpMethod.Put,
            body: {
                specialBody: "body"
            }
        });

        expect(response.status).toBe(403);
    })
})
