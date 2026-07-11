import "reflect-metadata"
import {container, singleton} from "tsyringe";
import {sign} from "crypto";
import {CoreModule, ExecutionContextKeynameEnum, Kernel} from "@pristine-ts/core";
import {controller, NetworkingModule, route, identity} from "@pristine-ts/networking";
import {authenticator, SecurityModule} from "@pristine-ts/security";
import {AppModuleInterface, HttpMethod, IdentityInterface, Request, Response, tag} from "@pristine-ts/common";
import {HttpClientInterface, HttpRequestInterface, HttpResponseInterface} from "@pristine-ts/http";
import {Auth0Authenticator, Auth0ConfigurationKeys, Auth0Module} from "@pristine-ts/auth0";

/**
 * End-to-end coverage for the module-level ("configured") expected audience: the audience
 * is set once via `pristine.auth0.expected.audience` (here through `kernel.start`) instead
 * of on every `@authenticator(Auth0Authenticator, {expectedAudience})` decorator. See
 * `auth0-protected.e2e.ts` for the decorator-option path.
 *
 * These drive the full request pipeline (config resolution -> DI -> Router ->
 * AuthenticationManager -> Auth0Authenticator), so they also prove that booting the kernel
 * with NO audience configured does not throw and simply skips the check.
 */

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

/**
 * Signs a JWT with RS256 using native Node crypto (the auth0 package no longer depends on
 * `jsonwebtoken`), so this scenario stays self-contained.
 */
const signToken = (payload: any, privateKeyPem: string, options: { keyid?: string } = {}): string => {
    const header: { alg: string; typ: string; kid?: string } = {alg: "RS256", typ: "JWT"};
    if (options.keyid !== undefined) {
        header.kid = options.keyid;
    }
    const toBase64Url = (value: object): string => Buffer.from(JSON.stringify(value)).toString("base64url");
    const signingInput = toBase64Url(header) + "." + toBase64Url(payload);
    const signature = sign("RSA-SHA256", Buffer.from(signingInput), privateKeyPem).toString("base64url");
    return signingInput + "." + signature;
};

@tag("HttpClientInterface")
export class MockHttpClient implements HttpClientInterface {
    request(request: HttpRequestInterface): Promise<HttpResponseInterface> {
        return Promise.resolve({
            body: publicKeys,
            request: {httpMethod: HttpMethod.Get, headers: {}, url: ""},
            headers: {},
            status: 200,
        });
    }
}

// The audience the OVERRIDE controller pins via a per-decorator option.
const optionAudience = "https://option.example";
// The audience configured at the module level in the "override" tests, deliberately
// different from optionAudience so we can prove the option wins.
const configAudienceForOverride = "https://config.example";

// Relies purely on the module-level configured audience (no decorator option).
@controller("/configured-audience")
@singleton()
@authenticator(Auth0Authenticator)
class ConfiguredAudienceController {
    @route(HttpMethod.Get, "/identity")
    public list(@identity() identity: IdentityInterface) {
        return identity;
    }
}

// Pins its own audience through the decorator option; used to prove the option overrides
// whatever is configured at the module level.
@controller("/override-audience")
@singleton()
@authenticator(Auth0Authenticator, {expectedAudience: optionAudience})
class OverrideAudienceController {
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

const buildPayload = (aud: string | string[]) => ({
    "sub": "aaaaaaaa-bbbb-cccc-dddd-example",
    "aud": aud,
    "iss": "https://auth0.com/",
    "exp": (Date.now() + 3600000) / 1000,
    "given_name": "Anaya",
    "iat": 1500009400,
    "email": "anaya@example.com",
    "scope": "read:messages openid profile"
});

describe("Auth0 authenticator - module-level configured audience", () => {
    // Make sure the environment variable never leaks in from the host/CI so the
    // "not configured" cases are deterministic.
    const previousAudienceEnv = process.env.PRISTINE_AUTH0_EXPECTED_AUDIENCE;

    beforeEach(() => {
        // Very important to clear the instances (incl. the singleton authenticator) between
        // executions so each kernel picks up its own configured audience.
        container.clearInstances();
        delete process.env.PRISTINE_AUTH0_EXPECTED_AUDIENCE;
    });

    afterAll(() => {
        if (previousAudienceEnv === undefined) {
            delete process.env.PRISTINE_AUTH0_EXPECTED_AUDIENCE;
        } else {
            process.env.PRISTINE_AUTH0_EXPECTED_AUDIENCE = previousAudienceEnv;
        }
    });

    const boot = async (configuration: { [key: string]: any } = {}): Promise<Kernel> => {
        const kernel = new Kernel();
        await kernel.start(moduleTest, {
            [Auth0ConfigurationKeys.IssuerDomain]: "auth0.com",
            "pristine.logging.consoleLoggerActivated": false,
            ...configuration,
        });
        return kernel;
    };

    const call = async (kernel: Kernel, path: string, payload: any): Promise<Response> => {
        const request: Request = new Request(HttpMethod.Get, "https://localhost:8080" + path, "uuid");
        request.setHeaders({
            "Authorization": "Bearer " + signToken(payload, privateKey, {keyid: tokenHeader.kid}),
        });
        return await kernel.handle(request, {keyname: ExecutionContextKeynameEnum.Jest, context: {}}) as Response;
    };

    it("authorizes when the token's aud contains the configured audience", async () => {
        const kernel = await boot({[Auth0ConfigurationKeys.ExpectedAudience]: "https://pristine-ts.com"});

        const payload = buildPayload(["example", "https://pristine-ts.com"]);
        const response = await call(kernel, "/configured-audience/identity", payload);

        expect(response.status).toBe(200);
        expect(response.body).toEqual({id: payload.sub, claims: payload});
    });

    it("rejects with 403 when the token's aud does not contain the configured audience", async () => {
        const kernel = await boot({[Auth0ConfigurationKeys.ExpectedAudience]: "https://pristine-ts.com"});

        const response = await call(kernel, "/configured-audience/identity", buildPayload(["example"]));

        expect(response.status).toBe(403);
        expect(response.body.code).toBe("FORBIDDEN");
    });

    it("boots and skips the audience check when NO audience is configured (backward compatible)", async () => {
        // No pristine.auth0.expected.audience passed: it resolves to "" and must not throw at
        // boot. With no option either, the aud claim is not validated.
        const kernel = await boot();

        const response = await call(kernel, "/configured-audience/identity", buildPayload(["some-unrelated-audience"]));

        expect(response.status).toBe(200);
        expect(response.body.id).toBe("aaaaaaaa-bbbb-cccc-dddd-example");
    });

    it("lets a per-decorator option override the configured audience (option matches -> 200)", async () => {
        const kernel = await boot({[Auth0ConfigurationKeys.ExpectedAudience]: configAudienceForOverride});

        // Token has the OPTION audience but not the CONFIG one: since the option wins, it passes.
        const response = await call(kernel, "/override-audience/identity", buildPayload(["example", optionAudience]));

        expect(response.status).toBe(200);
    });

    it("lets a per-decorator option override the configured audience (option mismatches -> 403)", async () => {
        const kernel = await boot({[Auth0ConfigurationKeys.ExpectedAudience]: configAudienceForOverride});

        // Token has the CONFIG audience but not the OPTION one: since the option wins and does
        // not match, the configured audience must NOT rescue it.
        const response = await call(kernel, "/override-audience/identity", buildPayload(["example", configAudienceForOverride]));

        expect(response.status).toBe(403);
        expect(response.body.code).toBe("FORBIDDEN");
    });
});
