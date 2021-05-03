import "reflect-metadata"
import {CognitoAuthenticator} from "./cognito.authenticator";
import {HttpClientInterface} from "../interfaces/http-client.interface";
import {HttpMethod, RequestInterface} from "@pristine-ts/networking";
import * as jwt from "jsonwebtoken";

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
let payload;

export class MockHttpClient implements HttpClientInterface {
    get<T>(url: string): Promise<T> {
        // @ts-ignore
        return Promise.resolve(publicKeys as T);
    }
}

describe("Cognito authenticator ", () => {

    beforeEach(() => {
        payload = {
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
            "email": "anaya@example.com"
        }
    });

    it("should get cognito issuer", async () => {
        const cognitoAuthenticator = new CognitoAuthenticator("us-east-1", "poolId", new MockHttpClient());
        expect(cognitoAuthenticator["getCognitoIssuer"]()).toBe("https://cognito-idp.us-east-1.amazonaws.com/poolId");
    });

    it("should get url", async () => {
        const cognitoAuthenticator = new CognitoAuthenticator("us-east-1", "poolId", new MockHttpClient());
        expect(cognitoAuthenticator["getPublicKeyUrl"]()).toBe("https://cognito-idp.us-east-1.amazonaws.com/poolId/.well-known/jwks.json");
    });

    it("should get pems", async () => {
        const cognitoAuthenticator = new CognitoAuthenticator("us-east-1", "poolId", new MockHttpClient());
        expect(await cognitoAuthenticator["getPems"]()).toEqual({
            "687dfb71-7ce9-42b5-b77c-c39ac2dfd21e": publicKey1,
            "fgjhlkhjlkhexample=": "-----BEGIN PUBLIC KEY-----\nMDEwDQYJKoZIhvcNAQEBBQADIAAwHQIWALII4ZZOo6ffLoKffLqd+IaXsWpqZQID\nAQAB\n-----END PUBLIC KEY-----\n"
        });
    });

    it("should validateRequestAndReturnToken", async () => {
        const cognitoAuthenticator = new CognitoAuthenticator("us-east-1", "poolId", new MockHttpClient());

        const request: RequestInterface = {
            body: {},
            url: "",
            httpMethod: HttpMethod.Get,
            headers: {
                "Authorization": "Bearer " + "token",
            }
        }
        expect(cognitoAuthenticator["validateRequestAndReturnToken"](request)).toBe("token");
    });

    it("should not validateRequestAndReturnToken if not headers", async () => {
        const cognitoAuthenticator = new CognitoAuthenticator("us-east-1", "poolId", new MockHttpClient());

        const request: RequestInterface = {
            body: {},
            url: "",
            httpMethod: HttpMethod.Get,
            headers: undefined
        }
        expect(() => cognitoAuthenticator["validateRequestAndReturnToken"](request)).toThrow(new Error("The Authorization header wasn't found in the Request."));
    });

    it("should not validateRequestAndReturnToken if no authorization header", async () => {
        const cognitoAuthenticator = new CognitoAuthenticator("us-east-1", "poolId", new MockHttpClient());

        const request: RequestInterface = {
            body: {},
            url: "",
            httpMethod: HttpMethod.Get,
            headers: {
                hello: "string"
            }
        }
        expect(() => cognitoAuthenticator["validateRequestAndReturnToken"](request)).toThrow(new Error("The Authorization header wasn't found in the Request."));
    });

    it("should not validateRequestAndReturnToken if authorization header undefined", async () => {
        const cognitoAuthenticator = new CognitoAuthenticator("us-east-1", "poolId", new MockHttpClient());

        const request: RequestInterface = {
            body: {},
            url: "",
            httpMethod: HttpMethod.Get,
            headers: {
                // @ts-ignore
                "Authorization": undefined
            }
        }
        expect(() => cognitoAuthenticator["validateRequestAndReturnToken"](request)).toThrow(new Error("The Authorization header wasn't found in the Request."));
    });

    it("should not validateRequestAndReturnToken if authorization header does not start with Bearer", async () => {
        const cognitoAuthenticator = new CognitoAuthenticator("us-east-1", "poolId", new MockHttpClient());

        const request: RequestInterface = {
            body: {},
            url: "",
            httpMethod: HttpMethod.Get,
            headers: {
                // @ts-ignore
                "Authorization": "token"
            }
        }
        expect(() => cognitoAuthenticator["validateRequestAndReturnToken"](request)).toThrow(new Error("The value in Authorization header doesn't start with 'Bearer '"));
    });

    it("should getAndVerifyClaims", async () => {
        const cognitoAuthenticator = new CognitoAuthenticator("us-east-1", "poolId", new MockHttpClient());
        const token = jwt.sign(payload, privateKey, { algorithm: 'RS256'});
        expect(cognitoAuthenticator["getAndVerifyClaims"](token, publicKey1)).toEqual(payload);
    });

    it("should not getAndVerifyClaims if expired", async () => {
        const cognitoAuthenticator = new CognitoAuthenticator("us-east-1", "poolId", new MockHttpClient());
        payload.exp = 1500000;
        const token = jwt.sign(payload, privateKey, { algorithm: 'RS256'});
        expect(() => cognitoAuthenticator["getAndVerifyClaims"](token, publicKey1)).toThrow(new Error("Invalid jwt: jwt expired"));
    });

    it("should not getAndVerifyClaims if auth time after", async () => {
        const cognitoAuthenticator = new CognitoAuthenticator("us-east-1", "poolId", new MockHttpClient());
        payload.auth_time = 1500000000000;
        const token = jwt.sign(payload, privateKey, { algorithm: 'RS256'});
        expect(() => cognitoAuthenticator["getAndVerifyClaims"](token, publicKey1)).toThrow(new Error('Claim is expired or invalid'));
    });

    it("should not getAndVerifyClaims if issuer different", async () => {
        const cognitoAuthenticator = new CognitoAuthenticator("us-east-1", "poolId", new MockHttpClient());
        payload.iss = "issuer";
        const token = jwt.sign(payload, privateKey, { algorithm: 'RS256'});
        expect(() => cognitoAuthenticator["getAndVerifyClaims"](token, publicKey1)).toThrow(new Error('Claim issuer is invalid'));
    });

    it("should not getAndVerifyClaims if token use different than access", async () => {
        const cognitoAuthenticator = new CognitoAuthenticator("us-east-1", "poolId", new MockHttpClient());
        payload.token_use = "hello";
        const token = jwt.sign(payload, privateKey, { algorithm: 'RS256'});
        expect(() => cognitoAuthenticator["getAndVerifyClaims"](token, publicKey1)).toThrow(new Error('Claim use is not access'));
    });

    it("should getKeyFromToken", async () => {
        const cognitoAuthenticator = new CognitoAuthenticator("us-east-1", "poolId", new MockHttpClient());
        const token = jwt.sign(payload, privateKey, { algorithm: 'RS256', keyid: "687dfb71-7ce9-42b5-b77c-c39ac2dfd21e"});
        const pems = {
            "687dfb71-7ce9-42b5-b77c-c39ac2dfd21e": publicKey1,
            "fgjhlkhjlkhexample=": "-----BEGIN PUBLIC KEY-----\nMDEwDQYJKoZIhvcNAQEBBQADIAAwHQIWALII4ZZOo6ffLoKffLqd+IaXsWpqZQID\nAQAB\n-----END PUBLIC KEY-----\n"
        }
        expect(cognitoAuthenticator["getKeyFromToken"](token, pems)).toBe(publicKey1);
    });

    it("should not getKeyFromToken if unknow kid", async () => {
        const cognitoAuthenticator = new CognitoAuthenticator("us-east-1", "poolId", new MockHttpClient());
        const token = jwt.sign(payload, privateKey, { algorithm: 'RS256', keyid: "hello"});
        const pems = {
            "687dfb71-7ce9-42b5-b77c-c39ac2dfd21e": publicKey1,
            "fgjhlkhjlkhexample=": "-----BEGIN PUBLIC KEY-----\nMDEwDQYJKoZIhvcNAQEBBQADIAAwHQIWALII4ZZOo6ffLoKffLqd+IaXsWpqZQID\nAQAB\n-----END PUBLIC KEY-----\n"
        }
        expect(() => cognitoAuthenticator["getKeyFromToken"](token, pems)).toThrow('Claim made for unknown kid');
    });

    it("should getTokenHeader", async () => {
        const cognitoAuthenticator = new CognitoAuthenticator("us-east-1", "poolId", new MockHttpClient());
        const token = jwt.sign(payload, privateKey, { algorithm: 'RS256', keyid: tokenHeader.kid});
        expect(cognitoAuthenticator["getTokenHeader"](token)).toEqual(tokenHeader);
    });

    it("should not getTokenHeader with invalid token", async () => {
        const cognitoAuthenticator = new CognitoAuthenticator("us-east-1", "poolId", new MockHttpClient());
        const token = "hello";
        expect(() => cognitoAuthenticator["getTokenHeader"](token)).toThrow('Token is invalid');
    });

    it("should authenticate", async () => {
        const cognitoAuthenticator = new CognitoAuthenticator("us-east-1", "poolId", new MockHttpClient());

        const request: RequestInterface = {
            body: {},
            url: "",
            httpMethod: HttpMethod.Get,
            headers: {
                // @ts-ignore
                "Authorization": "Bearer " + jwt.sign(payload, privateKey, { algorithm: 'RS256', keyid: tokenHeader.kid})
            }
        }
        expect(await cognitoAuthenticator["authenticate"](request)).toEqual({
            id: payload["cognito:username"],
            claims: payload
        });
    });
});
