import "reflect-metadata"
import {container} from "tsyringe";
import {CoreModule, ExecutionContextKeynameEnum, Kernel} from "@pristine-ts/core";
import {controller, NetworkingModule, route} from "@pristine-ts/networking";
import {JwtModule, JwtProtectedGuard, jwtPayload} from "@pristine-ts/jwt";
import {JWTKeys} from "./jwt.keys";
import {AppModuleInterface, HttpMethod, Request, Response} from "@pristine-ts/common";
import {guard} from "@pristine-ts/security";

describe("JWT Module instantiation in the Kernel", () => {

    beforeEach(async () => {
        // Very import to clear the instances in between executions.
        container.clearInstances();
    })

    @guard(JwtProtectedGuard)
    @controller("/api/2.0/jwt")
    class JwtTestController {
        @route(HttpMethod.Get, "/services")
        public route(@jwtPayload() jwtPayload: any) {
            return jwtPayload;
        }
    }

    it("should properly route a request, pass the decoded jwtPayload when a controller method has the @jwtPayload decorator, and return a successful response when the JWT is valid.", async () => {

        const kernel = new Kernel();
        await kernel.start({
            keyname: "jwt.test",
            importServices: [
                JwtTestController,
            ],
            importModules: [CoreModule, NetworkingModule, JwtModule],
            providerRegistrations: [],
        } as AppModuleInterface, {
            "pristine.jwt.algorithm": "RS256",
            "pristine.jwt.publicKey": JWTKeys.RS256.withoutPassphrase.public,
            "pristine.logging.consoleLoggerActivated": false,
            "pristine.logging.fileLoggerActivated": false,
        });

        const request: Request = new Request(HttpMethod.Get, "http://localhost:8080/api/2.0/jwt/services");
        request.headers = {
            "Authorization": "Bearer " + JWTKeys.token.valid,
        };

        const response = await kernel.handle(request, {keyname: ExecutionContextKeynameEnum.Jest, context: {}}) as Response;

        expect(response instanceof Response).toBeTruthy()
        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({
            "sub": "1234567890",
            "name": "Etienne Noel",
            "iat": 1516239022
        })
    })

    it("should throw an error when the configuration is not defined properly", () => {
        expect(false).toBeTruthy();
    })

    it("should return a forbidden exception when the JWT is invalid", async () => {
        const kernel = new Kernel();
        await kernel.start({
            keyname: "jwt.test",
            importServices: [
                JwtTestController,
            ],
            importModules: [CoreModule, NetworkingModule, JwtModule],
            providerRegistrations: []
        } as AppModuleInterface, {
            "pristine.jwt.algorithm": "RS256",
            "pristine.jwt.publicKey": JWTKeys.RS256.withoutPassphrase.public,
            "pristine.logging.consoleLoggerActivated": false,
            "pristine.logging.fileLoggerActivated": false,
        });

        const request: Request = new Request(HttpMethod.Get, "http://localhost:8080/api/2.0/jwt/services");
        request.headers = {
            "Authorization": "Bearer dfsadfdsafdsfdsafds",
        };

        const response = await kernel.handle(request, {keyname: ExecutionContextKeynameEnum.Jest, context: {}}) as Response;

        expect(response instanceof Response).toBeTruthy()
        expect(response.status).toBe(403);
    })
})
