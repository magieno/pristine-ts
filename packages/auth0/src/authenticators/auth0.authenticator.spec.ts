import "reflect-metadata"
import {Auth0Authenticator} from "./auth0.authenticator";
import {HttpMethod, Request} from "@pristine-ts/common";
import * as jwt from "jsonwebtoken";
import {HttpClientInterface, HttpRequestInterface, HttpResponseInterface} from "@pristine-ts/http";
import {LogHandlerInterface} from "@pristine-ts/logging";

const logHandlerMock: LogHandlerInterface = {
    critical(message: string, extra?: any): void {
    }, debug(message: string, extra?: any): void {
    }, error(message: string, extra?: any): void {
    }, info(message: string, extra?: any): void {
    }, warning(message: string, extra?: any): void {
    }, terminate() {
    }
}

const privateKey = "-----BEGIN PRIVATE KEY-----\n" +
    "MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQC6lQKD8qAZAL9h\n" +
    "BrK7wMyIbPuhZJEe1eyZgaOpLP6RJlMasBfxO3L0i3yGBdTXOv8veNt5wqDtSoFz\n" +
    "PImFWFLOJ+nNn1FcUoHoCEvUmHQrCv/2RnLwaON5126gnozQoF7sAFNPLcZ8wiTA\n" +
    "Hl600H/N06czi6ksC2H8Nte4zRG/4vYUyiMx9+ySHj5KCElcaWSHdkGJXml/R76M\n" +
    "PxvcsvXlrWGSMD31Ni6wJHE9rmJUtIOkQ8RlZpSb90VvZQVpJx+Vx1V4WzhVonxq\n" +
    "K1fxTS3fEybFnKc3vzTWJgM43bRo+5b9IyL8jfYZRWCIxcI+0Xs0mp2Ust73Slnh\n" +
    "Z+jEQrL3AgMBAAECggEBAKCm3vSXu0vr/dzgNJM/DZ1GIV+0xNOFJOSD4FQxXrvC\n" +
    "APpQtzzJkFCJrd2ENeBgdwr8CBYOBBxs84syi8KZ6yqA6WpYDGjuzdXpFsnlvti0\n" +
    "7vGxdRQVbBAj86gu/FZCT5jrKtBZPLd9PsGBJNCRWgnyfNwAG9jFsEfHPPVs9SR/\n" +
    "IiNb6BcwxUcPVAF/vwrwHg/OKp7yiTHClwo7mNr07W8NAbOoioQmZ10TIyQFz92O\n" +
    "+ezByVS8TB6RYzkrCvZSW1leIoIvqA6uaXcr1uzVdWdX0Itb8JY9x9+T83rsJxN4\n" +
    "UNyTap7iPYAKE476F1Y+mpQzrgzM+WjqbMldtW/VhQkCgYEA3/4RIZ+f7Cfj0TTS\n" +
    "O8d0l6+OJWcGtkjEKDmG6NJJWeQHApWxB+bIWosM2Oqff73HlftOtVELmQ8wdLJ6\n" +
    "O/cdMrLBmOXI49WpAVNcZ8+0EVSCG9q8LLCWKqV5WMWNJKB/oMVweiarhY7UmfmW\n" +
    "aDWSUcvDQ1uHessK3ffUIvZ6rUsCgYEA1T5sRCkX8jmZ9YdWO9gAxujmaB5PCx5l\n" +
    "5UQ/yoWymSKEHsoTQXMI4FQGvYPvvclPfpb9Ij/HEKQ6mxpVyvfXjTWn3mx7Ho2C\n" +
    "hPxH8b0b6EL0RPDV+yMoH3TZDpIlyQ0ho77wflWloNdrtcFW6PsNPtrzdeUVBkhG\n" +
    "vCg+nsSQIYUCgYB4jX0a45Zmu3FZf1xG4CpYGRwf9TsfkDpCi/OYCtV/k8JSGc6V\n" +
    "uhfK41uew2fkkHeCuSa7X0smrY4ewJAZBf6o8pxPdhyQwsWa+QqatKbtTNZZt3ff\n" +
    "dYrcmQKeTHSSae9Gz/yhQX6++whhdnsEyxBdBZWqAvD/nZfTrzZ1OsL70QKBgQCP\n" +
    "n1d0IOlL75fOUrS14anETqDAh4ldR8ABRpJgaOP9V838nsWRU1UrIezYP8B85tVv\n" +
    "wWoEY0hD4RjH1ljqNzsqlHTXzeCul0jNIM2j92aQbGfw9vRoDSm85go7Uhu46es6\n" +
    "SiPYMv828WBOLkXG7S/iob1QLlaWwJ9Doydp76HTsQKBgQDRdVYfEXDUmxHg0wzK\n" +
    "9nmiE2jwVtwoR0JFIuPfYgfHyPlVKjMZakKWiWdXTPPs0R2gmipzve+nnITBHmHd\n" +
    "L4Lu5XD8+E3fB+Oor6RaIZNTAlo2eRTfosEQ4bvD9ap60UTEa0dqmy3ExC3VQ/2M\nu" +
    "XslcWkaEgIsqaNdIttT5ZRhKQ==\n" +
    "-----END PRIVATE KEY-----\n";

const publicKey1 = "-----BEGIN PUBLIC KEY-----\n" +
    "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAupUCg/KgGQC/YQayu8DM\n" +
    "iGz7oWSRHtXsmYGjqSz+kSZTGrAX8Tty9It8hgXU1zr/L3jbecKg7UqBczyJhVhS\n" +
    "zifpzZ9RXFKB6AhL1Jh0Kwr/9kZy8GjjedduoJ6M0KBe7ABTTy3GfMIkwB5etNB/\n" +
    "zdOnM4upLAth/DbXuM0Rv+L2FMojMffskh4+SghJXGlkh3ZBiV5pf0e+jD8b3LL1\n" +
    "5a1hkjA99TYusCRxPa5iVLSDpEPEZWaUm/dFb2UFaScflcdVeFs4VaJ8aitX8U0t\n" +
    "3xMmxZynN7801iYDON20aPuW/SMi/I32GUVgiMXCPtF7NJqdlLLe90pZ4WfoxEKy\n" +
    "9wIDAQAB\n" +
    "-----END PUBLIC KEY-----\n";

const tokenHeader = {
    alg: "RS256",
    kid: "_yqByxvM35ith2LEcJnZtEtz0SDalDw_H3Spk5i0DRg",
    typ: "JWT"
};

const publicKeys = {
    "keys": [{
        "kty": "RSA",
        "e": "AQAB",
        "use": "sig",
        "kid": "_yqByxvM35ith2LEcJnZtEtz0SDalDw_H3Spk5i0DRg",
        "alg": "RS256",
        "n": "upUCg_KgGQC_YQayu8DMiGz7oWSRHtXsmYGjqSz-kSZTGrAX8Tty9It8hgXU1zr_L3jbecKg7UqBczyJhVhSzifpzZ9RXFKB6AhL1Jh0Kwr_9kZy8GjjedduoJ6M0KBe7ABTTy3GfMIkwB5etNB_zdOnM4upLAth_DbXuM0Rv-L2FMojMffskh4-SghJXGlkh3ZBiV5pf0e-jD8b3LL15a1hkjA99TYusCRxPa5iVLSDpEPEZWaUm_dFb2UFaScflcdVeFs4VaJ8aitX8U0t3xMmxZynN7801iYDON20aPuW_SMi_I32GUVgiMXCPtF7NJqdlLLe90pZ4WfoxEKy9w"
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
            "_yqByxvM35ith2LEcJnZtEtz0SDalDw_H3Spk5i0DRg": publicKey1,
        });
    });

    it("should validateRequestAndReturnToken", async () => {
        const auth0Authenticator = new Auth0Authenticator("auth0.com", new MockHttpClient(), logHandlerMock);

        const request: Request = new Request(HttpMethod.Get, "");
        request.setHeaders({
            "Authorization": "Bearer " + "token",
        });

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
        request.setHeaders({
            hello: "string"
        });

        expect(() => auth0Authenticator["validateRequestAndReturnToken"](request)).toThrow(new Error("The Authorization header wasn't found in the Request."));
    });

    it("should not validateRequestAndReturnToken if authorization header undefined", async () => {
        const auth0Authenticator = new Auth0Authenticator("auth0.com", new MockHttpClient(), logHandlerMock);

        const request: Request = new Request(HttpMethod.Get, "");
        request.setHeaders({
            "Authorization": undefined
        });

        expect(() => auth0Authenticator["validateRequestAndReturnToken"](request)).toThrow(new Error("The Authorization header wasn't found in the Request."));
    });

    it("should not validateRequestAndReturnToken if authorization header does not start with Bearer", async () => {
        const auth0Authenticator = new Auth0Authenticator("auth0.com", new MockHttpClient(), logHandlerMock);

        const request: Request = new Request(HttpMethod.Get, "");
        request.setHeaders({
            "Authorization": "token"
        });

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
        request.setHeaders({
            "Authorization": "Bearer " + jwt.sign(payload, privateKey, { algorithm: 'RS256', keyid: tokenHeader.kid})
        });

        expect(await auth0Authenticator["authenticate"](request)).toEqual({
            id: payload.sub,
            claims: payload
        });
    });
});
