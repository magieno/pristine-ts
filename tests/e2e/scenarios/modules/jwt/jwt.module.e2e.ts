import "reflect-metadata"
import {container} from "tsyringe";
import {CoreModule, ExecutionContextKeynameEnum, Kernel} from "@pristine-ts/core";
import {controller, NetworkingModule, route} from "@pristine-ts/networking";
import {JwtModule, JwtProtectedGuard, jwtPayload} from "@pristine-ts/jwt";
import {JWTKeys} from "./jwt.keys";
import {AppModuleInterface, HttpMethod, Request, Response} from "@pristine-ts/common";
import {guard} from "@pristine-ts/security";
import {ConfigurationValidationError} from "@pristine-ts/configuration";
import {sign} from "jsonwebtoken";

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
        });

        const request: Request = new Request(HttpMethod.Get, "http://localhost:8080/api/2.0/jwt/services", "uuid");
        request.setHeaders({
            "Authorization": "Bearer " + JWTKeys.token.valid,
        });

        const response = await kernel.handle(request, {keyname: ExecutionContextKeynameEnum.Jest, context: {}}) as Response;

        expect(response instanceof Response).toBeTruthy()
        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({
            "sub": "1234567890",
            "name": "Etienne Noel",
            "iat": 1516239022
        })
    })

    it("should throw an error when the configuration the public key is not defined", async () => {
        const kernel = new Kernel();
        return expect(kernel.start({
            keyname: "jwt.test",
            importServices: [
                JwtTestController,
            ],
            importModules: [CoreModule, NetworkingModule, JwtModule],
            providerRegistrations: [],
        } as AppModuleInterface, {
            "pristine.logging.consoleLoggerActivated": false,
        })).rejects.toThrow(new ConfigurationValidationError(["The Configuration with key: 'pristine.jwt.publicKey' is required and must be defined."]));
    })

    const startJwtKernel = async () => {
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
        });
        return kernel;
    };

    it("should return a 401 UNAUTHORIZED (login, not refresh) when the JWT is invalid", async () => {
        const kernel = await startJwtKernel();

        const request: Request = new Request(HttpMethod.Get, "http://localhost:8080/api/2.0/jwt/services", "uuid");
        request.setHeaders({
            "Authorization": "Bearer dfsadfdsafdsfdsafds",
        });

        const response = await kernel.handle(request, {keyname: ExecutionContextKeynameEnum.Jest, context: {}}) as Response;

        expect(response instanceof Response).toBeTruthy()
        expect(response.status).toBe(401);
        expect((response.body as any).code).toBe("UNAUTHORIZED");
    })

    it("should return a 401 TOKEN_EXPIRED (so the client can refresh) when the JWT is expired", async () => {
        const kernel = await startJwtKernel();

        const expiredJwt = sign({sub: "1234567890"}, JWTKeys.RS256.withoutPassphrase.private, {
            algorithm: "RS256",
            expiresIn: -60, // Issued already expired.
        });

        const request: Request = new Request(HttpMethod.Get, "http://localhost:8080/api/2.0/jwt/services", "uuid");
        request.setHeaders({
            "Authorization": "Bearer " + expiredJwt,
        });

        const response = await kernel.handle(request, {keyname: ExecutionContextKeynameEnum.Jest, context: {}}) as Response;

        expect(response instanceof Response).toBeTruthy()
        expect(response.status).toBe(401);
        expect((response.body as any).code).toBe("TOKEN_EXPIRED");
    })

    it("should return a 401 UNAUTHORIZED when the Authorization header is missing", async () => {
        const kernel = await startJwtKernel();

        const request: Request = new Request(HttpMethod.Get, "http://localhost:8080/api/2.0/jwt/services", "uuid");

        const response = await kernel.handle(request, {keyname: ExecutionContextKeynameEnum.Jest, context: {}}) as Response;

        expect(response instanceof Response).toBeTruthy()
        expect(response.status).toBe(401);
        expect((response.body as any).code).toBe("UNAUTHORIZED");
    })
})
