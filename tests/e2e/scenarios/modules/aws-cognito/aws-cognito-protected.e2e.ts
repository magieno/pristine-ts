import "reflect-metadata"
import {container, singleton} from "tsyringe";
import {CoreModule, ExecutionContextKeynameEnum, Kernel} from "@pristine-ts/core";
import {controller, NetworkingModule, route, identity} from "@pristine-ts/networking";
import {authenticator, guard, SecurityModule} from "@pristine-ts/security";
import {AwsCognitoAuthenticator, AwsCognitoGroupGuard, AwsCognitoModule} from "@pristine-ts/aws-cognito";
import {AppModuleInterface, HttpMethod, IdentityInterface, Request, Response, tag} from "@pristine-ts/common";
import * as jwt from "jsonwebtoken";
import {HttpClientInterface, HttpRequestInterface, HttpResponseInterface} from "@pristine-ts/http";

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
@authenticator(AwsCognitoAuthenticator)
@guard(AwsCognitoGroupGuard, {groups: ["ADMIN"]})
class TestController {

    @route(HttpMethod.Get, "/identity")
    public list(@identity() identity: IdentityInterface) {
        return identity;
    }
}

const moduleTest: AppModuleInterface = {
    keyname: "Module",
    importModules: [
        CoreModule,
        NetworkingModule,
        AwsCognitoModule,
        SecurityModule,
    ],
    importServices: [],
}

describe("Aws cognito authenticator", () => {
    beforeEach(async () => {
        // Very import to clear the instances in between executions.
        container.clearInstances();
    })

    it("should return the identity", async () => {
        const payload = {
            "sub": "aaaaaaaa-bbbb-cccc-dddd-example",
            "aud": "xxxxxxxxxxxxexample",
            "email_verified": true,
            "token_use": "access",
            "auth_time": 1500009400,
            "iss": "https://cognito-idp.us-east-1.amazonaws.com/poolId",
            "cognito:username": "anaya",
            "exp": (Date.now() + 3600000)/1000,
            "given_name": "Anaya",
            "iat": 1500009400,
            "email": "anaya@example.com",
            "cognito:groups": [
                "USER",
                "ADMIN"
            ]
        }

        const kernel = new Kernel();
        await kernel.start(moduleTest, {
            "pristine.aws-cognito.poolId": "poolId",
            "pristine.logging.consoleLoggerActivated": false,
            "pristine.logging.fileLoggerActivated": false,
        });

        const request: Request = new Request(HttpMethod.Get, "https://localhost:8080/api/identity");
        request.headers = {
            "Authorization": "Bearer " + jwt.sign(payload, privateKey, { algorithm: 'RS256', keyid: tokenHeader.kid})
        }

        const response = await kernel.handle(request, {keyname: ExecutionContextKeynameEnum.Jest, context: {}}) as Response;

        expect(response instanceof Response).toBeTruthy()
        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            id: "anaya",
            claims: payload,
        })
    })

    it("should return forbidden if does not have the group", async () => {
        const payload = {
            "sub": "aaaaaaaa-bbbb-cccc-dddd-example",
            "aud": "xxxxxxxxxxxxexample",
            "email_verified": true,
            "token_use": "access",
            "auth_time": 1500009400,
            "iss": "https://cognito-idp.us-east-1.amazonaws.com/poolId",
            "cognito:username": "anaya",
            "exp": (Date.now() + 3600000)/1000,
            "given_name": "Anaya",
            "iat": 1500009400,
            "email": "anaya@example.com",
            "cognito:groups": [
                "USER",
            ]
        }

        const kernel = new Kernel();
        await kernel.start(moduleTest, {
            "pristine.aws-cognito.poolId": "poolId",
            "pristine.logging.consoleLoggerActivated": false,
            "pristine.logging.fileLoggerActivated": false,
        });

        const request: Request = new Request(HttpMethod.Get, "https://localhost:8080/api/identity");
        request.headers = {
            "Authorization": "Bearer " + jwt.sign(payload, privateKey, { algorithm: 'RS256', keyid: tokenHeader.kid})
        }

        const response = await kernel.handle(request, {keyname: ExecutionContextKeynameEnum.Jest, context: {}}) as Response;

        expect(response.status).toBe(403);
        expect(response.body).toEqual(expect.objectContaining({
                message: "You are not allowed to access this.",
                name: "Error",
        }))
    })
});
