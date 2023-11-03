import "reflect-metadata"
import {container, singleton} from "tsyringe";
import {CoreModule, ExecutionContextKeynameEnum, Kernel} from "@pristine-ts/core";
import {controller, NetworkingModule, route, identity} from "@pristine-ts/networking";
import {authenticator, guard, RoleGuard, SecurityModule, SecurityModuleKeyname} from "@pristine-ts/security";
import {AppModuleInterface, HttpMethod, IdentityInterface, Request, Response, tag} from "@pristine-ts/common";
import * as jwt from "jsonwebtoken";
import {HttpClientInterface, HttpRequestInterface, HttpResponseInterface} from "@pristine-ts/http";
import {Auth0Authenticator, Auth0Module, Auth0ModuleKeyname} from "@pristine-ts/auth0";

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

const moduleTest: AppModuleInterface = {
    keyname: "Module",
    importModules: [
        CoreModule,
        NetworkingModule,
        Auth0Module,
        SecurityModule,
    ],
    importServices: [],
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
        await kernel.start(moduleTest, {
            [Auth0ModuleKeyname + ".issuer.domain"]: "auth0.com",
            [SecurityModuleKeyname + ".rolesClaimKey"]: "https://pristine-ts.com/roles",
            "pristine.logging.consoleLoggerActivated": false,
            "pristine.logging.fileLoggerActivated": false,
        });

        const request: Request = new Request(HttpMethod.Get, "https://localhost:8080/api/identity");
        request.setHeaders({
            "Authorization": "Bearer " + jwt.sign(payload, privateKey, { algorithm: 'RS256', keyid: tokenHeader.kid})
        });

        const response = await kernel.handle(request, {keyname: ExecutionContextKeynameEnum.Jest, context: {}}) as Response;

        expect(response instanceof Response).toBeTruthy();
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
        await kernel.start(moduleTest, {
            [Auth0ModuleKeyname + ".issuer.domain"]: "auth0.com",
            [SecurityModuleKeyname + ".rolesClaimKey"]: "https://pristine-ts.com/roles",
            "pristine.logging.consoleLoggerActivated": false,
            "pristine.logging.fileLoggerActivated": false,
        });

        const request: Request = new Request(HttpMethod.Get, "https://localhost:8080/api/identity")
        request.setHeaders({
            "Authorization": "Bearer " + jwt.sign(payload, privateKey, { algorithm: 'RS256', keyid: tokenHeader.kid})
        });

        const response = await kernel.handle(request, {keyname: ExecutionContextKeynameEnum.Jest, context: {}}) as Response;

        expect(response.status).toBe(403);
        expect(response.body.name).toBe("Error");
        expect(response.body.message).toBe("You are not allowed to access this.");
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
        await kernel.start(moduleTest, {
            [Auth0ModuleKeyname + ".issuer.domain"]: "auth0.com",
            [SecurityModuleKeyname + ".rolesClaimKey"]: "https://pristine-ts.com/roles",
            "pristine.logging.consoleLoggerActivated": false,
            "pristine.logging.fileLoggerActivated": false,
        });

        const request: Request = new Request(HttpMethod.Get, "https://localhost:8080/api/identity");
        request.setHeaders({
            "Authorization": "Bearer " + jwt.sign(payload, privateKey, { algorithm: 'RS256', keyid: tokenHeader.kid})
        })

        const response = await kernel.handle(request, {keyname: ExecutionContextKeynameEnum.Jest, context: {}}) as Response;

        expect(response.status).toBe(403);
        expect(response.body.name).toBe("Error");
        expect(response.body.message).toBe("You are not allowed to access this.");
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
        await kernel.start(moduleTest, {
            [Auth0ModuleKeyname + ".issuer.domain"]: "auth0.com",
            [SecurityModuleKeyname + ".rolesClaimKey"]: "https://pristine-ts.com/roles",
            "pristine.logging.consoleLoggerActivated": false,
            "pristine.logging.fileLoggerActivated": false,
        });

        const request: Request = new Request(HttpMethod.Get, "https://localhost:8080/api/identity");
        request.setHeaders({
            "Authorization": "Bearer " + jwt.sign(payload, privateKey, { algorithm: 'RS256', keyid: tokenHeader.kid})
        })

        const response = await kernel.handle(request, {keyname: ExecutionContextKeynameEnum.Jest, context: {}}) as Response;

        expect(response.status).toBe(403);
        expect(response.body.name).toBe("Error");
        expect(response.body.message).toBe("You are not allowed to access this.");
    })
});
