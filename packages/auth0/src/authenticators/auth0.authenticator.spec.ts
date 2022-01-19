import "reflect-metadata"
import {Auth0Authenticator} from "./auth0.authenticator";
import {HttpMethod, Request} from "@pristine-ts/common";
import * as jwt from "jsonwebtoken";
import {HttpClientInterface, HttpRequestInterface, HttpResponseInterface} from "@pristine-ts/http";
import {LogHandlerInterface} from "@pristine-ts/logging";

const logHandlerMock: LogHandlerInterface = {
    debug(message: string, extra?: any) {
    },
    info(message: string, extra?: any) {
    },
    error(message: string, extra?: any) {
    }
    ,critical(message: string, extra?: any) {
    },
    warning(message: string, extra?: any) {
    },
}

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
let payload: any;

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

describe("Auth0 authenticator ", () => {

    beforeEach(() => {
        payload = {
            "sub": "aaaaaaaa-bbbb-cccc-dddd-example",
            "aud": [
                "example",
                "https://pristine-ts.com"
            ],
            "iss": "https://auth0.com/",
            "exp": (Date.now() + 3600000)/1000,
            "given_name": "Anaya",
            "iat": 1500009400,
            "email": "anaya@example.com",
            "scope": "read:messages openid profile"
        }
    });

    it("should get auth0 issuer", async () => {
        const auth0Authenticator = new Auth0Authenticator("auth0.com", new MockHttpClient(), logHandlerMock);
        expect(auth0Authenticator["getAuth0Issuer"]()).toBe("https://auth0.com/");
    });

    it("should get url", async () => {
        const auth0Authenticator = new Auth0Authenticator("auth0.com", new MockHttpClient(), logHandlerMock);
        expect(auth0Authenticator["getPublicKeyUrl"]()).toBe("https://auth0.com/.well-known/jwks.json");
    });

    it("should get pems", async () => {
        const auth0Authenticator = new Auth0Authenticator("auth0.com", new MockHttpClient(), logHandlerMock);
        expect(await auth0Authenticator["getPems"]()).toEqual({
            "687dfb71-7ce9-42b5-b77c-c39ac2dfd21e": publicKey1,
            "fgjhlkhjlkhexample=": "-----BEGIN PUBLIC KEY-----\nMDEwDQYJKoZIhvcNAQEBBQADIAAwHQIWALII4ZZOo6ffLoKffLqd+IaXsWpqZQID\nAQAB\n-----END PUBLIC KEY-----\n"
        });
    });

    it("should validateRequestAndReturnToken", async () => {
        const auth0Authenticator = new Auth0Authenticator("auth0.com", new MockHttpClient(), logHandlerMock);

        const request: Request = new Request(HttpMethod.Get, "");
        request.headers = {
            "Authorization": "Bearer " + "token",
        };

        expect(auth0Authenticator["validateRequestAndReturnToken"](request)).toBe("token");
    });

    it("should not validateRequestAndReturnToken if not headers", async () => {
        const auth0Authenticator = new Auth0Authenticator("auth0.com", new MockHttpClient(), logHandlerMock);

        const request: Request = new Request(HttpMethod.Get, "");

        expect(() => auth0Authenticator["validateRequestAndReturnToken"](request)).toThrow(new Error("The Authorization header wasn't found in the Request."));
    });

    it("should not validateRequestAndReturnToken if no authorization header", async () => {
        const auth0Authenticator = new Auth0Authenticator("auth0.com", new MockHttpClient(), logHandlerMock);

        const request: Request = new Request(HttpMethod.Get, "");
        request.headers = {
            hello: "string"
        };

        expect(() => auth0Authenticator["validateRequestAndReturnToken"](request)).toThrow(new Error("The Authorization header wasn't found in the Request."));
    });

    it("should not validateRequestAndReturnToken if authorization header undefined", async () => {
        const auth0Authenticator = new Auth0Authenticator("auth0.com", new MockHttpClient(), logHandlerMock);

        const request: Request = new Request(HttpMethod.Get, "");
        request.headers = {
            "Authorization": undefined
        }

        expect(() => auth0Authenticator["validateRequestAndReturnToken"](request)).toThrow(new Error("The Authorization header wasn't found in the Request."));
    });

    it("should not validateRequestAndReturnToken if authorization header does not start with Bearer", async () => {
        const auth0Authenticator = new Auth0Authenticator("auth0.com", new MockHttpClient(), logHandlerMock);

        const request: Request = new Request(HttpMethod.Get, "");
        request.headers = {
            "Authorization": "token"
        }

        expect(() => auth0Authenticator["validateRequestAndReturnToken"](request)).toThrow(new Error("The value in Authorization header doesn't start with 'Bearer '"));
    });

    it("should getAndVerifyClaims", async () => {
        const auth0Authenticator = new Auth0Authenticator("auth0.com", new MockHttpClient(), logHandlerMock);
        const token = jwt.sign(payload, privateKey, { algorithm: 'RS256'});
        const context = {
            options: {
                expectedAudience: "https://pristine-ts.com",
                expectedScopes: ["read:messages"]
            }
        }
        await auth0Authenticator.setContext(context);
        expect(auth0Authenticator["getAndVerifyClaims"](token, publicKey1)).toEqual(payload);
    });

    it("should throw error when getAndVerifyClaims and token does not have expected audience", async () => {
        const auth0Authenticator = new Auth0Authenticator("auth0.com", new MockHttpClient(), logHandlerMock);
        const token = jwt.sign(payload, privateKey, { algorithm: 'RS256'});
        const context = {
            options: {
                expectedAudience: "https://pristine-ts.com123",
                expectedScopes: ["read:messages"]
            }
        }
        await auth0Authenticator.setContext(context);
        expect(() => auth0Authenticator["getAndVerifyClaims"](token, publicKey1)).toThrow(new Error('Claim audience does not include expected audience'));
    });


    it("should throw error when getAndVerifyClaims and token does not have expected scope", async () => {
        const auth0Authenticator = new Auth0Authenticator("auth0.com", new MockHttpClient(), logHandlerMock);
        const token = jwt.sign(payload, privateKey, { algorithm: 'RS256'});
        const context = {
            options: {
                expectedAudience: "https://pristine-ts.com",
                expectedScopes: ["read:users"]
            }
        }
        await auth0Authenticator.setContext(context);
        expect(() => auth0Authenticator["getAndVerifyClaims"](token, publicKey1)).toThrow(new Error("Claim does not contain the required scope: 'read:users'" ));
    });

    it("should not getAndVerifyClaims if expired", async () => {
        const auth0Authenticator = new Auth0Authenticator("auth0.com", new MockHttpClient(), logHandlerMock);
        payload.exp = 1500000;
        const token = jwt.sign(payload, privateKey, { algorithm: 'RS256'});
        expect(() => auth0Authenticator["getAndVerifyClaims"](token, publicKey1)).toThrow(new Error("Invalid jwt: jwt expired"));
    });

    it("should not getAndVerifyClaims if auth time after", async () => {
        const auth0Authenticator = new Auth0Authenticator("auth0.com", new MockHttpClient(), logHandlerMock);
        payload.auth_time = 1500000000000;
        const token = jwt.sign(payload, privateKey, { algorithm: 'RS256'});
        expect(() => auth0Authenticator["getAndVerifyClaims"](token, publicKey1)).toThrow(new Error('Claim is expired or invalid'));
    });

    it("should not getAndVerifyClaims if issuer different", async () => {
        const auth0Authenticator = new Auth0Authenticator("auth0.com", new MockHttpClient(), logHandlerMock);
        payload.iss = "issuer";
        const token = jwt.sign(payload, privateKey, { algorithm: 'RS256'});
        expect(() => auth0Authenticator["getAndVerifyClaims"](token, publicKey1)).toThrow(new Error('Claim issuer is invalid'));
    });

    it("should getKeyFromToken", async () => {
        const auth0Authenticator = new Auth0Authenticator("auth0.com", new MockHttpClient(), logHandlerMock);
        const token = jwt.sign(payload, privateKey, { algorithm: 'RS256', keyid: "687dfb71-7ce9-42b5-b77c-c39ac2dfd21e"});
        const pems = {
            "687dfb71-7ce9-42b5-b77c-c39ac2dfd21e": publicKey1,
            "fgjhlkhjlkhexample=": "-----BEGIN PUBLIC KEY-----\nMDEwDQYJKoZIhvcNAQEBBQADIAAwHQIWALII4ZZOo6ffLoKffLqd+IaXsWpqZQID\nAQAB\n-----END PUBLIC KEY-----\n"
        }
        expect(auth0Authenticator["getKeyFromToken"](token, pems)).toBe(publicKey1);
    });

    it("should not getKeyFromToken if unknow kid", async () => {
        const auth0Authenticator = new Auth0Authenticator("auth0.com", new MockHttpClient(), logHandlerMock);
        const token = jwt.sign(payload, privateKey, { algorithm: 'RS256', keyid: "hello"});
        const pems = {
            "687dfb71-7ce9-42b5-b77c-c39ac2dfd21e": publicKey1,
            "fgjhlkhjlkhexample=": "-----BEGIN PUBLIC KEY-----\nMDEwDQYJKoZIhvcNAQEBBQADIAAwHQIWALII4ZZOo6ffLoKffLqd+IaXsWpqZQID\nAQAB\n-----END PUBLIC KEY-----\n"
        }
        expect(() => auth0Authenticator["getKeyFromToken"](token, pems)).toThrow('Claim made for unknown kid');
    });

    it("should getTokenHeader", async () => {
        const auth0Authenticator = new Auth0Authenticator("auth0.com", new MockHttpClient(), logHandlerMock);
        const token = jwt.sign(payload, privateKey, { algorithm: 'RS256', keyid: tokenHeader.kid});
        expect(auth0Authenticator["getTokenHeader"](token)).toEqual(tokenHeader);
    });

    it("should not getTokenHeader with invalid token", async () => {
        const auth0Authenticator = new Auth0Authenticator("auth0.com", new MockHttpClient(), logHandlerMock);
        const token = "hello";
        expect(() => auth0Authenticator["getTokenHeader"](token)).toThrow('Token is invalid');
    });

    it("should authenticate", async () => {
        const auth0Authenticator = new Auth0Authenticator("auth0.com", new MockHttpClient(), logHandlerMock);
        const context = {
            options: {
                expectedAudience: "https://pristine-ts.com",
                expectedScopes: ["read:messages"]
            }
        }

        await auth0Authenticator.setContext(context);
        const request: Request = new Request(HttpMethod.Get, "");
        request.headers = {
            "Authorization": "Bearer " + jwt.sign(payload, privateKey, { algorithm: 'RS256', keyid: tokenHeader.kid})
        }

        expect(await auth0Authenticator["authenticate"](request)).toEqual({
            id: payload.sub,
            claims: payload
        });
    });
});
