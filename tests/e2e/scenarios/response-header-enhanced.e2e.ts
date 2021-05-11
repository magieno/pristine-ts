import "reflect-metadata"
import {singleton, container} from "tsyringe";
import {CoreModule, Kernel} from "@pristine-ts/core";
import {testModule} from "../src/test.module";
import {ResolvedClassModel} from "../src/models/resolved-class.model";
import {PermissionManager} from "../src/managers/permission.manager";
import {
    controller,
    identity,
    NetworkingModule,
    responseHeader,
    route,
    routeParameter
} from "@pristine-ts/networking";
import {authenticator, guard, SecurityModule, SecurityModuleKeyname} from "@pristine-ts/security";
import {AwsCognitoAuthenticator, AwsCognitoGroupGuard, AwsCognitoModule} from "@pristine-ts/aws-cognito";
import {HttpMethod, IdentityInterface, ModuleInterface, RequestInterface, tag} from "@pristine-ts/common";
import * as jwt from "jsonwebtoken";
import {HttpClientInterface} from "@pristine-ts/aws-cognito/dist/lib/esm/interfaces/http-client.interface";

@controller("/api")
@singleton()
class TestController {

    @responseHeader("Cache-Control", "no-cache")
    @route(HttpMethod.Get, "/test")
    public list() {
        return "test"
    }
}

const moduleTest: ModuleInterface = {
    keyname: "Module",
    importServices: [],
    importModules: [
        CoreModule,
        NetworkingModule,
    ]
}

describe("Response header enhancer", () => {
    beforeEach(async () => {
        // Very import to clear the instances in between executions.
        container.clearInstances();
    })

    it("should enhance the response with the specified header", async () => {

        const kernel = new Kernel();
        await kernel.init(moduleTest);

        const request: RequestInterface = {
            url: "https://localhost:8080/api/test",
            httpMethod: HttpMethod.Get,
            body: {},
        }

        const response = await kernel.handleRequest(request);

        expect(response.status).toBe(200);
        expect(response.body).toEqual("test");
        expect(response.headers).toEqual({"Cache-Control": "no-cache"});
    })
});
