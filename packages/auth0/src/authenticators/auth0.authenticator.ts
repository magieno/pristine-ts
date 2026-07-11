import {inject, injectable, singleton} from "tsyringe";
import {createPublicKey, verify} from "crypto";
import {HttpMethod, IdentityInterface, injectConfig, Request, traced} from "@pristine-ts/common";
import {TokenHeaderInterface} from "../interfaces/token-header.interface";
import {ClaimInterface} from "../interfaces/claim.interface";
import {Auth0AuthenticatorOptionsInterface} from "../interfaces/auth0-authenticator-options.interface";
import {AuthenticatorContextInterface, AuthenticatorInterface} from "@pristine-ts/security";
import {HttpClientInterface, ResponseTypeEnum} from "@pristine-ts/http";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {Auth0ConfigurationKeys} from "../auth0.configuration-keys";

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
   * Phantom marker consumed by the `@authenticator` decorator to type-check its options
   * argument against {@link Auth0AuthenticatorOptionsInterface}, i.e.
   * `@authenticator(Auth0Authenticator, {expectedAudience, expectedScopes})`. `declare`
   * makes it type-only — it emits no runtime field.
   */
  declare static readonly __options?: Auth0AuthenticatorOptionsInterface;

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
   * The context passed by the decorator. Its `options` (typed as
   * {@link Auth0AuthenticatorOptionsInterface}) carry the per-route Auth0 settings.
   * @private
   */
  private context?: AuthenticatorContextInterface;

  /**
   * The Auth0 authenticator that can be passed to the @authenticator decorator.
   * @param issuerDomain The Auth0 issuer domain (without the http://).
   * @param httpClient The Http client to use to make the requests to the issuer.
   * @param logHandler The log handler to print some logs.
   * @param configuredAudience The audience (`aud` claim) expected on tokens, configured at
   *   the module level via `pristine.auth0.expected.audience` /
   *   `PRISTINE_AUTH0_EXPECTED_AUDIENCE`. Optional: resolves to `""` ("unset") when not
   *   configured, in which case the audience check is skipped unless a per-decorator
   *   `expectedAudience` option is provided.
   */
  constructor(@injectConfig(Auth0ConfigurationKeys.IssuerDomain) private readonly issuerDomain: string,
              @inject("HttpClientInterface") private readonly httpClient: HttpClientInterface,
              @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
              @injectConfig(Auth0ConfigurationKeys.ExpectedAudience) private readonly configuredAudience?: string,
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
   * Returns the typed options carried on the decorator context, or `undefined` when no
   * context or options were set. Reading through this accessor keeps the `context` access
   * null-safe and gives the option reads a concrete type.
   * @private
   */
  private getOptions(): Auth0AuthenticatorOptionsInterface | undefined {
    return this.context?.options;
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

    const options = this.getOptions();

    // Resolve the expected audience with precedence: the per-decorator option first (a
    // per-route override), then the module-level configured audience. The check is only
    // enforced when an audience is actually set — with neither an option nor configuration
    // (the config resolves to the "" sentinel when unset), the `aud` claim is not validated,
    // preserving the previous opt-in behavior.
    const expectedAudience = options?.expectedAudience ?? this.configuredAudience;

    // Normalize to a list of non-empty audiences. This supports an array of expected
    // audiences (the check becomes "the token's aud intersects the expected set") and drops
    // the "" sentinel used when nothing is configured.
    const expectedAudiences: string[] = (Array.isArray(expectedAudience) ? expectedAudience : [expectedAudience])
      .filter((audience): audience is string => typeof audience === "string" && audience.length > 0);

    if (expectedAudiences.length > 0) {
      // `aud` per RFC 7519 can be either a single string or an array of strings (Auth0
      // commonly issues an array, e.g. the API id plus `/userinfo`). Normalize to an array
      // so membership is an EXACT match rather than the substring match `String.includes`
      // would perform on a single-string `aud`.
      const audClaim: string | string[] = claim.aud;
      const tokenAudiences: string[] = Array.isArray(audClaim) ? audClaim : [audClaim];

      if (expectedAudiences.some((audience) => tokenAudiences.includes(audience)) === false) {
        throw new Error('Claim audience does not include expected audience');
      }
    }

    // If the context has expected scopes, verify that the token has those scopes.
    const expectedScopesOption = options?.expectedScopes;
    if (expectedScopesOption) {
      const providedScopes: string[] = claim.scope.split(' ');
      const expectedScopes = Array.isArray(expectedScopesOption) ? expectedScopesOption : [expectedScopesOption];
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
