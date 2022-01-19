import "reflect-metadata"
import {container, singleton} from "tsyringe";
import {CoreModule, Kernel} from "@pristine-ts/core";
import {controller, identity, NetworkingModule, route} from "@pristine-ts/networking";
import {authenticator, guard, SecurityModule, SecurityModuleKeyname} from "@pristine-ts/security";
import {AwsCognitoGroupGuard} from "@pristine-ts/aws-cognito";
import {HttpMethod, IdentityInterface, ModuleInterface, tag} from "@pristine-ts/common";
import * as jwt from "jsonwebtoken";
import {HttpClientInterface, HttpRequestInterface, HttpResponseInterface} from "@pristine-ts/http";
import {Auth0Authenticator, Auth0Module, Auth0ModuleKeyname} from "@pristine-ts/auth0";
import {RoleGuard} from "@pristine-ts/security";

const privateKey = "-----BEGIN RSA PRIVATE KEY-----\n" +
    "MIIBOQIBAAJAXmWi+JMuW8v5Ng5sDso+H6wl+i9u7lwMxJrZ+j0VQNEh4E7EwHQM\n" +
    "PEnPJkTO3cKg6lDwKZ4HX/5BsAQ8ST5nywIDAQABAkAwU7hrqm5BcNvVYOzRZZkI\n" +
    "fgmzXDVesqGWxfByvHL1C30kB6mvPC6K9iBuaN0MrwR2YIR+LPDmKbFC3jkVzkwB\n" +
    "AiEAn1BRnlbHKfv7fArL+TX/mRy8jJ4KjuQfMWATt7QnGCsCIQCXr5Iao/wCDzHL\n" +
    "E5aI00CE5J1W+yU9fvbvQUtA63d+4QIhAJcusUWBNB8zcMOVu1sTUysJiiQnFf3j\n" +
    "nXZNpmh+HVthAiAU1magyEQ3WDUD68XzN+oWF33R1CByiT2M8pBO88nvoQIgLVZo\n" +
    "5AsRaiJAQou6tjgUqHJrP4uv+Q5kKncGzN5aEy8=\n" +
    "-----END RSA PRIVATE KEY-----\n";

const publicKey1 = "-----BEGIN PUBLIC KEY-----\n" +
    "MFswDQYJKoZIhvcNAQEBBQADSgAwRwJAXmWi+JMuW8v5Ng5sDso+H6wl+i9u7lwM\n" +
    "xJrZ+j0VQNEh4E7EwHQMPEnPJkTO3cKg6lDwKZ4HX/5BsAQ8ST5nywIDAQAB\n" +
    "-----END PUBLIC KEY-----\n";

const tokenHeader = {
    alg: "RS256",
    kid: "687dfb71-7ce9-42b5-b77c-c39ac2dfd21e",
    typ: "JWT"
};

const publicKeys = {
    "keys": [{
        "alg": "RS256",
        "kty":"RSA",
        "e":"AQAB",
        "kid":"687dfb71-7ce9-42b5-b77c-c39ac2dfd21e",
        "n":"XmWi-JMuW8v5Ng5sDso-H6wl-i9u7lwMxJrZ-j0VQNEh4E7EwHQMPEnPJkTO3cKg6lDwKZ4HX_5BsAQ8ST5nyw"
    }, {
        "alg": "RS256",
        "e": "AQAB",
        "kid": "fgjhlkhjlkhexample=",
        "kty": "RSA",
        "n": "sgjhlk6jp98ugp98up34hpexample",
        "use": "sig"
    }]
}

@tag("HttpClientInterface")
export class MockHttpClient implements HttpClientInterface {

    request(request: HttpRequestInterface): Promise<HttpResponseInterface> {
        return Promise.resolve({
            body: publicKeys,
            request: {
                httpMethod: HttpMethod.Get,
                headers: {},
                url: "",
            },
            headers: {},
            status: 200,
        });
    }
}


@controller("/api")
@singleton()
@authenticator(Auth0Authenticator, {expectedAudience: "https://pristine-ts.com", expectedScopes: ["read:messages"]})
@guard(RoleGuard, {roles: ["ADMIN"]})
class TestController {

    @route(HttpMethod.Get, "/identity")
    public list(@identity() identity: IdentityInterface) {
        return identity;
    }
}

const moduleTest: ModuleInterface = {
    keyname: "Module",
    importModules: [
        CoreModule,
        NetworkingModule,
        Auth0Module,
        SecurityModule,
    ],
}

describe("Auth0 authenticator", () => {
    beforeEach(async () => {
        // Very import to clear the instances in between executions.
        container.clearInstances();
    })

    it("should return the identity", async () => {
        const payload = {
            "sub": "aaaaaaaa-bbbb-cccc-dddd-example",
            "aud": [
                "example",
                "https://pristine-ts.com"
            ],
            "https://pristine-ts.com/roles": [
                "ADMIN"
            ],
            "iss": "https://auth0.com/",
            "exp": (Date.now() + 3600000)/1000,
            "given_name": "Anaya",
            "iat": 1500009400,
            "email": "anaya@example.com",
            "scope": "read:messages openid profile"
        }

        const kernel = new Kernel();
        await kernel.init(moduleTest, {
            [Auth0ModuleKeyname + ".domain"]: "auth0.com",
            [SecurityModuleKeyname + ".rolesClaimKey"]: "https://pristine-ts.com/roles",
            "pristine.logging.consoleLoggerActivated": false,
            "pristine.logging.fileLoggerActivated": false,
        });

        const request: Request = {
            url: "https://localhost:8080/api/identity",
            httpMethod: HttpMethod.Get,
            body: {},
            headers: {
                // @ts-ignore
                "Authorization": "Bearer " + jwt.sign(payload, privateKey, { algorithm: 'RS256', keyid: tokenHeader.kid})
            }
        }

        const response = await kernel.handleRequest(request);

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            id: payload.sub,
            claims: payload,
        })
    })

    it("should return forbidden if does not have the audience", async () => {
        const payload = {
            "sub": "aaaaaaaa-bbbb-cccc-dddd-example",
            "aud": [
                "example",
            ],
            "https://pristine-ts.com/roles": [
                "ADMIN"
            ],
            "iss": "https://auth0.com/",
            "exp": (Date.now() + 3600000)/1000,
            "given_name": "Anaya",
            "iat": 1500009400,
            "email": "anaya@example.com",
            "scope": "openid profile"
        }

        const kernel = new Kernel();
        await kernel.init(moduleTest, {
            [Auth0ModuleKeyname + ".domain"]: "auth0.com",
            [SecurityModuleKeyname + ".rolesClaimKey"]: "https://pristine-ts.com/roles",
            "pristine.logging.consoleLoggerActivated": false,
            "pristine.logging.fileLoggerActivated": false,
        });

        const request: Request = {
            url: "https://localhost:8080/api/identity",
            httpMethod: HttpMethod.Get,
            body: {},
            headers: {
                // @ts-ignore
                "Authorization": "Bearer " + jwt.sign(payload, privateKey, { algorithm: 'RS256', keyid: tokenHeader.kid})
            }
        }

        const response = await kernel.handleRequest(request);

        expect(response.status).toBe(403);
        expect(response.body).toEqual({
                message: "You are not allowed to access this.",
                name: "Error",
        })
    })

    it("should return forbidden if does not have the scope", async () => {
        const payload = {
            "sub": "aaaaaaaa-bbbb-cccc-dddd-example",
            "aud": [
                "example",
                "https://pristine-ts.com"
            ],
            "https://pristine-ts.com/roles": [
                "ADMIN"
            ],
            "iss": "https://auth0.com/",
            "exp": (Date.now() + 3600000)/1000,
            "given_name": "Anaya",
            "iat": 1500009400,
            "email": "anaya@example.com",
            "scope": "openid profile"
        }

        const kernel = new Kernel();
        await kernel.init(moduleTest, {
            [Auth0ModuleKeyname + ".domain"]: "auth0.com",
            [SecurityModuleKeyname + ".rolesClaimKey"]: "https://pristine-ts.com/roles",
            "pristine.logging.consoleLoggerActivated": false,
            "pristine.logging.fileLoggerActivated": false,
        });

        const request: Request = {
            url: "https://localhost:8080/api/identity",
            httpMethod: HttpMethod.Get,
            body: {},
            headers: {
                // @ts-ignore
                "Authorization": "Bearer " + jwt.sign(payload, privateKey, { algorithm: 'RS256', keyid: tokenHeader.kid})
            }
        }

        const response = await kernel.handleRequest(request);

        expect(response.status).toBe(403);
        expect(response.body).toEqual({
                message: "You are not allowed to access this.",
                name: "Error",
        })
    })

    it("should return forbidden if does not have the role", async () => {
        const payload = {
            "sub": "aaaaaaaa-bbbb-cccc-dddd-example",
            "aud": [
                "example",
                "https://pristine-ts.com"
            ],
            "https://pristine-ts.com/roles": [
                "USER"
            ],
            "iss": "https://auth0.com/",
            "exp": (Date.now() + 3600000)/1000,
            "given_name": "Anaya",
            "iat": 1500009400,
            "email": "anaya@example.com",
            "scope": "read:messages openid profile"
        }

        const kernel = new Kernel();
        await kernel.init(moduleTest, {
            [Auth0ModuleKeyname + ".domain"]: "auth0.com",
            [SecurityModuleKeyname + ".rolesClaimKey"]: "https://pristine-ts.com/roles",
            "pristine.logging.consoleLoggerActivated": false,
            "pristine.logging.fileLoggerActivated": false,
        });

        const request: Request = {
            url: "https://localhost:8080/api/identity",
            httpMethod: HttpMethod.Get,
            body: {},
            headers: {
                // @ts-ignore
                "Authorization": "Bearer " + jwt.sign(payload, privateKey, { algorithm: 'RS256', keyid: tokenHeader.kid})
            }
        }

        const response = await kernel.handleRequest(request);

        expect(response.status).toBe(403);
        expect(response.body).toEqual({
                message: "You are not allowed to access this.",
                name: "Error",
        })
    })
});
