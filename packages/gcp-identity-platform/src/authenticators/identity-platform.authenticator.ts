import {inject, injectable, singleton} from "tsyringe";
import * as jwt from "jsonwebtoken";
import {HttpMethod, IdentityInterface, Request, traced} from "@pristine-ts/common";
import {AuthenticatorInterface} from "@pristine-ts/security";
import {HttpClientInterface, ResponseTypeEnum} from "@pristine-ts/http";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {GcpIdentityPlatformModuleKeyname} from "../gcp-identity-platform.module.keyname";
import {ClaimInterface} from "../interfaces/claim.interface";
import {TokenHeaderInterface} from "../interfaces/token-header.interface";

/**
 * The IdentityPlatformAuthenticator verifies Firebase ID tokens (issued by Identity
 * Platform / Firebase Auth). To use, apply via `@authenticator(IdentityPlatformAuthenticator)`
 * on a controller class or method.
 *
 * Verification flow (mirrors `AwsCognitoAuthenticator`):
 *   1. Fetch the X.509 cert set from the Google securetoken endpoint and cache it.
 *   2. Extract the Bearer token from the Authorization header.
 *   3. Pick the cert that matches the token's `kid`.
 *   4. Verify the RS256 signature.
 *   5. Validate standard claims: `iss === https://securetoken.google.com/{projectId}`,
 *      `aud === projectId`, `exp` in the future, `auth_time` in the past.
 *
 * Singleton so the cert cache is reused across requests.
 */
@singleton()
@injectable()
export class IdentityPlatformAuthenticator implements AuthenticatorInterface {
  /**
   * Google's X.509 cert endpoint for Firebase ID tokens. Each entry maps `kid` →
   * PEM-encoded public cert.
   */
  private static readonly CERTS_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

  private cachedCerts: { [kid: string]: string } | undefined;
  private context: any;

  constructor(
    @inject(`%${GcpIdentityPlatformModuleKeyname}.projectId%`) private readonly projectId: string,
    @inject("HttpClientInterface") private readonly httpClient: HttpClientInterface,
    @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
  ) {
  }

  setContext(context: any): Promise<void> {
    this.context = context;
    return Promise.resolve();
  }

  @traced()
  async authenticate(request: Request): Promise<IdentityInterface> {
    this.cachedCerts = this.cachedCerts ?? await this.getCerts();
    const token = this.validateRequestAndReturnToken(request);
    const cert = this.getCertForToken(token, this.cachedCerts);
    const claim = this.getAndVerifyClaims(token, cert);

    this.logHandler.debug("IdentityPlatformAuthenticator: Claim verified.", {extra: {claim}});

    return {
      id: claim.user_id ?? claim.sub,
      claims: claim,
    };
  }

  private async getCerts(): Promise<{ [kid: string]: string }> {
    const response = await this.httpClient.request({
      httpMethod: HttpMethod.Get,
      url: IdentityPlatformAuthenticator.CERTS_URL,
    }, {
      responseType: ResponseTypeEnum.Json,
    });
    return response.body as { [kid: string]: string };
  }

  private validateRequestAndReturnToken(request: Request): string {
    if (request.headers === undefined || (request.hasHeader("Authorization") === false && request.hasHeader("authorization") === false)) {
      throw new Error("The Authorization header wasn't found in the Request.");
    }
    const authorizationHeader = request.headers.Authorization ?? request.headers.authorization;
    if (authorizationHeader === undefined) {
      throw new Error("The Authorization header wasn't found in the Request.");
    }
    if (authorizationHeader.startsWith("Bearer ") === false) {
      throw new Error("The value in Authorization header doesn't start with 'Bearer '");
    }
    return authorizationHeader.substr(7, authorizationHeader.length);
  }

  private getCertForToken(token: string, certs: { [kid: string]: string }): string {
    const header = this.getTokenHeader(token);
    const cert = certs[header.kid];
    if (cert === undefined) {
      throw new Error("Claim made for unknown kid");
    }
    return cert;
  }

  private getTokenHeader(token: string): TokenHeaderInterface {
    const tokenSections = (token || "").split(".");
    if (tokenSections.length < 2) {
      throw new Error("Token is invalid");
    }
    const headerJSON = Buffer.from(tokenSections[0], "base64").toString("utf8");
    return JSON.parse(headerJSON) as TokenHeaderInterface;
  }

  private getAndVerifyClaims(token: string, cert: string): ClaimInterface {
    let claim: ClaimInterface;
    try {
      claim = jwt.verify(token, cert, {algorithms: ["RS256"]}) as ClaimInterface;
    } catch (err) {
      throw new Error("Invalid jwt: " + (err as Error).message);
    }

    const currentSeconds = Math.floor(Date.now() / 1000);
    if (currentSeconds > claim.exp || currentSeconds < claim.auth_time) {
      throw new Error("Claim is expired or invalid");
    }
    const expectedIssuer = `https://securetoken.google.com/${this.projectId}`;
    if (claim.iss !== expectedIssuer) {
      throw new Error("Claim issuer is invalid");
    }
    if (claim.aud !== this.projectId) {
      throw new Error("Claim audience is invalid");
    }
    return claim;
  }
}
