import "reflect-metadata";
import * as crypto from "crypto";
import * as jwt from "jsonwebtoken";
import {container} from "tsyringe";
import {Request, HttpMethod} from "@pristine-ts/common";
import {IdentityPlatformAuthenticator, IdentityPlatformClaimGuard} from "@pristine-ts/gcp-identity-platform";

/**
 * Generates an RSA keypair plus a self-signed X.509 cert PEM for the public half.
 * The Google securetoken endpoint returns `{kid: certPEM}` — `jwt.verify` accepts
 * either a PEM-encoded public key OR a PEM-encoded certificate, so we can hand the
 * raw public PEM directly without going through the X.509 wrapper. That lets us
 * keep the test self-contained without pulling in `node-forge`.
 */
const generateKeyPair = () => {
    const {privateKey, publicKey} = crypto.generateKeyPairSync("rsa", {
        modulusLength: 2048,
        publicKeyEncoding: {type: "spki", format: "pem"},
        privateKeyEncoding: {type: "pkcs8", format: "pem"},
    });
    return {privateKey, publicKey};
};

const buildAuthenticator = (projectId: string, certs: { [kid: string]: string }, noopLog: any) => {
    const mockHttpClient = {
        request: async () => ({body: certs}),
    };
    return new IdentityPlatformAuthenticator(projectId, mockHttpClient as any, noopLog);
};

const noopLog = {debug: () => {}, info: () => {}, warning: () => {}, error: () => {}, critical: () => {}, terminate: () => {}};

const buildRequest = (token: string): Request => {
    const r = new Request(HttpMethod.Get, "/protected", "req-1");
    r.setHeaders({authorization: `Bearer ${token}`});
    return r;
};

describe("GCP Identity Platform authenticator (E2E)", () => {
    beforeEach(() => container.clearInstances());

    const projectId = "test-project";
    const kid = "test-kid";

    const signToken = (privateKey: string, overrides: any = {}) => {
        const now = Math.floor(Date.now() / 1000);
        const payload = {
            iss: `https://securetoken.google.com/${projectId}`,
            aud: projectId,
            auth_time: now - 60,
            iat: now,
            exp: now + 3600,
            sub: "user-abc",
            user_id: "user-abc",
            firebase: {sign_in_provider: "password"},
            admin: true,
            ...overrides,
        };
        return jwt.sign(payload, privateKey, {algorithm: "RS256", header: {alg: "RS256", kid}});
    };

    it("authenticate accepts a valid signed Firebase ID token", async () => {
        const {privateKey, publicKey} = generateKeyPair();
        const authenticator = buildAuthenticator(projectId, {[kid]: publicKey}, noopLog);
        const token = signToken(privateKey);
        const identity = await authenticator.authenticate(buildRequest(token));
        expect(identity.id).toBe("user-abc");
        expect(identity.claims.aud).toBe(projectId);
    });

    it("authenticate rejects an expired token", async () => {
        const {privateKey, publicKey} = generateKeyPair();
        const authenticator = buildAuthenticator(projectId, {[kid]: publicKey}, noopLog);
        const token = signToken(privateKey, {exp: Math.floor(Date.now() / 1000) - 60, iat: Math.floor(Date.now() / 1000) - 7200});
        await expect(authenticator.authenticate(buildRequest(token))).rejects.toThrow();
    });

    it("authenticate rejects a token with the wrong audience", async () => {
        const {privateKey, publicKey} = generateKeyPair();
        const authenticator = buildAuthenticator(projectId, {[kid]: publicKey}, noopLog);
        const token = signToken(privateKey, {aud: "different-project"});
        await expect(authenticator.authenticate(buildRequest(token))).rejects.toThrow(/audience/);
    });

    it("authenticate rejects a token with the wrong issuer", async () => {
        const {privateKey, publicKey} = generateKeyPair();
        const authenticator = buildAuthenticator(projectId, {[kid]: publicKey}, noopLog);
        const token = signToken(privateKey, {iss: "https://accounts.google.com"});
        await expect(authenticator.authenticate(buildRequest(token))).rejects.toThrow(/issuer/);
    });

    it("authenticate rejects when the kid is not in the cached cert set", async () => {
        const {privateKey, publicKey} = generateKeyPair();
        const authenticator = buildAuthenticator(projectId, {"other-kid": publicKey}, noopLog);
        const token = signToken(privateKey);
        await expect(authenticator.authenticate(buildRequest(token))).rejects.toThrow(/unknown kid/);
    });

    it("authenticate rejects requests missing the Authorization header", async () => {
        const {publicKey} = generateKeyPair();
        const authenticator = buildAuthenticator(projectId, {[kid]: publicKey}, noopLog);
        const r = new Request(HttpMethod.Get, "/protected", "req-2");
        r.setHeaders({});
        await expect(authenticator.authenticate(r)).rejects.toThrow();
    });
});

describe("GCP Identity Platform claim guard (E2E)", () => {
    beforeEach(() => container.clearInstances());

    it("isAuthorized returns true when every required claim is truthy", async () => {
        const guard = new IdentityPlatformClaimGuard();
        await guard.setContext({options: {claims: ["admin"]}} as any);
        const ok = await guard.isAuthorized(new Request(HttpMethod.Get, "/", "x"), {id: "u", claims: {admin: true}});
        expect(ok).toBe(true);
    });

    it("isAuthorized returns false when a required claim is missing", async () => {
        const guard = new IdentityPlatformClaimGuard();
        await guard.setContext({options: {claims: ["admin", "billing"]}} as any);
        const ok = await guard.isAuthorized(new Request(HttpMethod.Get, "/", "x"), {id: "u", claims: {admin: true}});
        expect(ok).toBe(false);
    });

    it("isAuthorized returns true when no required claims configured", async () => {
        const guard = new IdentityPlatformClaimGuard();
        await guard.setContext({options: {}} as any);
        const ok = await guard.isAuthorized(new Request(HttpMethod.Get, "/", "x"), {id: "u", claims: {}});
        expect(ok).toBe(true);
    });
});
