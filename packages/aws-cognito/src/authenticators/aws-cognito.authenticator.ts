import {inject, injectable, singleton} from "tsyringe";
import {AwsCognitoModuleKeyname} from "../aws-cognito.module.keyname";
import * as jwt from "jsonwebtoken";
import {HttpMethod, IdentityInterface, RequestInterface} from "@pristine-ts/common";
import {TokenHeaderInterface} from "../interfaces/token-header.interface";
import {ClaimInterface} from "../interfaces/claim.interface";
import {AuthenticatorInterface} from "@pristine-ts/security";
import {HttpClientInterface, ResponseTypeEnum} from "@pristine-ts/http";
import {LogHandlerInterface} from "@pristine-ts/logging";
import jwkToBuffer from "jwk-to-pem";


@singleton()
@injectable()
export class AwsCognitoAuthenticator implements AuthenticatorInterface{

    private cachedPems: any;
    private cognitoIssuer: string;
    private publicKeyUrl: string;
    private context: any;

    /**
     * The AWS cognito authenticator that can be passed to the @authenticator decorator.
     * @param region The AWS region
     * @param poolId The AWS cognito pool id.
     * @param httpClient The Http client to use to make the requests to the issuer.
     * @param logHandler The log handler to print some logs.
     */
    constructor(@inject(`%${AwsCognitoModuleKeyname}.region%`) private readonly region: string,
                @inject(`%${AwsCognitoModuleKeyname}.poolId%`) private readonly poolId: string,
                @inject("HttpClientInterface") private readonly httpClient: HttpClientInterface,
                @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
                ) {
        this.cognitoIssuer = this.getCognitoIssuer();
        this.publicKeyUrl = this.getPublicKeyUrl();
    }

    /**
     * Sets the context for the authenticator as it is passed in a decorator
     * @param context
     */
    setContext(context: any): Promise<void> {
        this.context = context;
        return Promise.resolve();
    }

    /**
     * Gets the identity from the request
     * @param request
     */
    async authenticate(request: RequestInterface): Promise<IdentityInterface> {
        this.cachedPems = this.cachedPems ?? await this.getPems();
        const token = this.validateRequestAndReturnToken(request);
        const key = this.getKeyFromToken(token, this.cachedPems);

        const claim = this.getAndVerifyClaims(token, key);

        this.logHandler.debug("Claim confirmed", {
            claim,
        }, AwsCognitoModuleKeyname);

        return {
            id: claim["cognito:username"],
            claims: claim
        }
    }

    /**
     * Gets the issuer for Cognito
     * @private
     */
    private getCognitoIssuer(): string {
        return "https://cognito-idp." + this.region + ".amazonaws.com/" + this.poolId
    }

    /**
     * Gets the url of the public key
     * @private
     */
    private getPublicKeyUrl(): string {
        return this.cognitoIssuer + "/.well-known/jwks.json";
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

        const pems: {[key: string]: string} = publicKeys.keys.reduce((agg: any, current: any) => {
            agg[current.kid] = jwkToBuffer(current);
            return agg;
        }, {} as {[key: string]: string});

        return pems;
    }

    /**
     * Validates the request and returns the token
     * @param request
     * @private
     */
    // todo: this is a copy from jwt manager should we put that somewhere common ?
    private validateRequestAndReturnToken(request: RequestInterface): string {
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
     * @param token
     * @param key
     * @private
     */
    private getAndVerifyClaims(token: string, key: string): ClaimInterface {
        let claim;
        try {
            claim = jwt.verify(token, key) as ClaimInterface;
        } catch(err) {
            throw new Error("Invalid jwt: " + err.message);
        }

        const currentSeconds = Math.floor( (new Date()).valueOf() / 1000);
        if (currentSeconds > claim.exp || currentSeconds < claim.auth_time) {
            throw new Error('Claim is expired or invalid');
        }
        if (claim.iss !== this.cognitoIssuer) {
            throw new Error('Claim issuer is invalid');
        }

        // We'll remove this for now as cognito authorizer only authorizes id token.
        // if (claim.token_use !== 'access') {
        //     throw new Error('Claim use is not access');
        // }

        return claim;
    }

    /**
     * Gets the key based on the kid of the token
     * @param token
     * @param pems
     * @private
     */
    private getKeyFromToken(token: string, pems:{[key: string]: string}): string {
        const header = this.getTokenHeader(token);
        const key = pems[header.kid];
        if (key === undefined) {
            throw new Error('Claim made for unknown kid');
        }
        return key;
    }

    /**
     * Gets the token header
     * @param token
     * @private
     */
    private getTokenHeader(token: string): TokenHeaderInterface {
        const tokenSections = (token || '').split('.');
        if (tokenSections.length < 2) {
            throw new Error('Token is invalid');
        }
        const headerJSON = Buffer.from(tokenSections[0], 'base64').toString('utf8');
        return  JSON.parse(headerJSON) as TokenHeaderInterface;
    }
}
