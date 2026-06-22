import {inject, injectable, singleton} from "tsyringe";
import {createPublicKey, verify} from "crypto";
import {HttpMethod, IdentityInterface, Request, traced} from "@pristine-ts/common";
import {TokenHeaderInterface} from "../interfaces/token-header.interface";
import {ClaimInterface} from "../interfaces/claim.interface";
import {AuthenticatorInterface} from "@pristine-ts/security";
import {HttpClientInterface, ResponseTypeEnum} from "@pristine-ts/http";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {Auth0ModuleKeyname} from "../auth0.module.keyname";

/**
 * The Auth0Authenticator is an authenticator that can be passed to the @authenticator decorator on a
 * controller class to authenticate the incoming requests using Auth0.
 *
 * It is singleton so that the PEMs can be cached.
 */
@singleton()
@injectable()
export class Auth0Authenticator implements AuthenticatorInterface {

  /**
   * The cached PEMs to avoid fetching everytime.
   * @private
   */
  private cachedPems: any;

  /**
   * The complete url of the Auth0 issuer.
   * @private
   */
  private auth0Issuer: string;

  /**
   * The url where to get the public key.
   * @private
   */
  private publicKeyUrl: string;

  /**
   * The context passed by the decorator.
   * @private
   */
  private context: any;

  /**
   * The Auth0 authenticator that can be passed to the @authenticator decorator.
   * @param issuerDomain The Auth0 issuer domain (without the http://).
   * @param httpClient The Http client to use to make the requests to the issuer.
   * @param logHandler The log handler to print some logs.
   */
  constructor(@inject(`%${Auth0ModuleKeyname}.issuer.domain%`) private readonly issuerDomain: string,
              @inject("HttpClientInterface") private readonly httpClient: HttpClientInterface,
              @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
  ) {
    this.auth0Issuer = this.getAuth0Issuer();
    this.publicKeyUrl = this.getPublicKeyUrl();
  }

  /**
   * Sets the context for the authenticator as it is passed in a decorator
   * @param context The context for the decorator.
   */
  setContext(context: any): Promise<void> {
    this.context = context;
    return Promise.resolve();
  }

  /**
   * Gets the identity from the request
   * @param request The request to authenticate.
   */
  @traced()
  async authenticate(request: Request): Promise<IdentityInterface> {
    this.cachedPems = this.cachedPems ?? await this.getPems();
    const token = this.validateRequestAndReturnToken(request);
    const key = this.getKeyFromToken(token, this.cachedPems);

    const claim = this.getAndVerifyClaims(token, key);

    this.logHandler.debug("Auth0Authenticator: Claim confirmed.", {
      extra: {
        claim,
      },
    });

    return {
      id: claim.sub,
      claims: claim
    }
  }

  /**
   * Builds the complete url of the issuer for Auth0.
   * @private
   */
  private getAuth0Issuer(): string {
    return "https://" + this.issuerDomain + "/";
  }

  /**
   * Gets the url of the public key
   * @private
   */
  private getPublicKeyUrl(): string {
    return this.auth0Issuer + ".well-known/jwks.json";
  }

  /**
   * Gets the public keys
   * @private
   */
  private async getPems() {
    const publicKeysResponse = await this.httpClient.request({
      httpMethod: HttpMethod.Get,
      url: this.publicKeyUrl,
    }, {
      responseType: ResponseTypeEnum.Json,
    });

    const publicKeys = publicKeysResponse.body;

    // Create a map key id : key. The JWK is converted to a SPKI PEM using native Node
    // crypto (replacing the jwk-to-pem dependency); the PEM output is byte-for-byte
    // identical to what jwk-to-pem produced.
    const pems: { [key: string]: string } = publicKeys.keys.reduce((agg: any, current: any) => {
      agg[current.kid] = createPublicKey({key: current, format: "jwk"}).export({type: "spki", format: "pem"}) as string;
      return agg;
    }, {} as { [key: string]: string });

    return pems;
  }

  /**
   * Validates the request and returns the token
   * @param request The request to validate.
   * @private
   */
  // todo: this is a copy from jwt manager should we put that somewhere common ?
  private validateRequestAndReturnToken(request: Request): string {
    if (request.headers === undefined || (request.headers.hasOwnProperty("Authorization") === false && request.headers.hasOwnProperty("authorization") === false)) {
      throw new Error("The Authorization header wasn't found in the Request.");
      // throw new MissingAuthorizationHeaderError("The Authorization header wasn't found in the Request.");
    }

    const authorizationHeader = request.headers.Authorization ?? request.headers.authorization;

    if (authorizationHeader === undefined) {
      throw new Error("The Authorization header wasn't found in the Request.");

      // throw new MissingAuthorizationHeaderError("The Authorization header wasn't found in the Request.");
    }

    if (authorizationHeader.startsWith("Bearer ") === false) {
      throw new Error("The value in Authorization header doesn't start with 'Bearer '");

      // throw new InvalidAuthorizationHeaderError("The value in Authorization header doesn't start with 'Bearer '")
    }

    return authorizationHeader.substr(7, authorizationHeader.length);
  }

  /**
   * Verifies the token and returns the claims.
   * @param token The string token.
   * @param key The key to verify the token.
   * @private
   */
  private getAndVerifyClaims(token: string, key: string): ClaimInterface {
    let claim;
    try {
      claim = this.verifyTokenAndDecode(token, key);
    } catch (err) {
      throw new Error("Invalid jwt: " + (err as Error).message);
    }

    // Verify if the token is expired or was auth_time is invalid
    const currentSeconds = Math.floor((new Date()).valueOf() / 1000);
    if (currentSeconds > claim.exp || currentSeconds < claim.auth_time) {
      throw new Error('Claim is expired or invalid');
    }
    // Verify if issuer is the auth0 issuer.
    if (claim.iss !== this.auth0Issuer) {
      throw new Error('Claim issuer is invalid');
    }

    // If the context has an expected audience verify that this audience is included in the token.
    if (this.context.options?.expectedAudience && claim.aud.includes(this.context.options?.expectedAudience) === false) {
      throw new Error('Claim audience does not include expected audience');
    }

    // If the context has expected scopes, verify that the token has those scopes.
    if (this.context.options?.expectedScopes) {
      const providedScopes: string[] = claim.scope.split(' ');
      const expectedScopes = Array.isArray(this.context.options?.expectedScopes) === false ? [this.context.options?.expectedScopes] : this.context.options?.expectedScopes
      for (const scope of expectedScopes) {
        if (providedScopes.includes(scope) === false) {
          throw new Error("Claim does not contain the required scope: '" + scope + "'");
        }
      }
    }

    return claim;
  }

  /**
   * Verifies the RS256 signature of the token with the provided PEM public key and
   * returns the decoded claims. Throws if the token is malformed, the signature is
   * invalid, or the token is expired.
   *
   * This replaces `jsonwebtoken`'s `verify` with native Node crypto so the package no
   * longer pulls in the `jsonwebtoken` -> `jws` -> `jwa` -> `buffer-equal-constant-time`
   * chain, whose reliance on the `SlowBuffer` API breaks under Node 26.
   *
   * @param token The string token.
   * @param key The PEM-encoded public key to verify the token with.
   * @private
   */
  private verifyTokenAndDecode(token: string, key: string): ClaimInterface {
    const tokenSections = (token || "").split(".");
    if (tokenSections.length !== 3) {
      throw new Error("jwt malformed");
    }

    const signingInput = tokenSections[0] + "." + tokenSections[1];
    const signature = Buffer.from(tokenSections[2], "base64url");

    // Auth0 signs its tokens with RS256; pinning the algorithm also guards against
    // algorithm-substitution attacks.
    if (verify("RSA-SHA256", Buffer.from(signingInput), key, signature) === false) {
      throw new Error("invalid signature");
    }

    const claim = JSON.parse(Buffer.from(tokenSections[1], "base64url").toString("utf8")) as ClaimInterface;

    if (claim.exp !== undefined && Math.floor(Date.now() / 1000) >= claim.exp) {
      throw new Error("jwt expired");
    }

    return claim;
  }

  /**
   * Gets the key based on the kid of the token
   * @param token The string token.
   * @param pems The pems.
   * @private
   */
  private getKeyFromToken(token: string, pems: { [key: string]: string }): string {
    const header = this.getTokenHeader(token);
    const key = pems[header.kid];
    if (key === undefined) {
      throw new Error('Claim made for unknown kid');
    }
    return key;
  }

  /**
   * Gets the token header from the string token.
   * @param token The string token.
   * @private
   */
  private getTokenHeader(token: string): TokenHeaderInterface {
    const tokenSections = (token || '').split('.');
    if (tokenSections.length < 2) {
      throw new Error('Token is invalid');
    }
    const headerJSON = Buffer.from(tokenSections[0], 'base64').toString('utf8');
    return JSON.parse(headerJSON) as TokenHeaderInterface;
  }
}
