import {inject, injectable, singleton} from "tsyringe";
import {AwsCognitoModuleKeyname} from "../aws-cognito.module.keyname";
import * as jwt from "jsonwebtoken";
import {HttpMethod, IdentityInterface, RequestInterface} from "@pristine-ts/common";
import {TokenHeaderInterface} from "../interfaces/token-header.interface";
import {ClaimInterface} from "../interfaces/claim.interface";
import {AuthenticatorInterface} from "@pristine-ts/security";
import {HttpClientInterface, ResponseTypeEnum} from "@pristine-ts/http";

const jwkToPem = require("jwk-to-pem");

@singleton()
@injectable()
export class AwsCognitoAuthenticator implements AuthenticatorInterface{

    private cachedPems;
    private cognitoIssuer;
    private publicKeyUrl;
    private context;

    constructor(@inject(`%${AwsCognitoModuleKeyname}.region%`) private readonly region: string,
                @inject(`%${AwsCognitoModuleKeyname}.poolId%`) private readonly poolId: string,
                @inject("HttpClientInterface") private readonly httpClient: HttpClientInterface,
                ) {
        this.cognitoIssuer = this.getCognitoIssuer();
        this.publicKeyUrl = this.getPublicKeyUrl();
    }

    setContext(context: any): Promise<void> {
        this.context = context;
        return Promise.resolve();
    }

    async authenticate(request: RequestInterface): Promise<IdentityInterface> {
        this.cachedPems = this.cachedPems ?? await this.getPems();
        const token = this.validateRequestAndReturnToken(request);
        const key = this.getKeyFromToken(token, this.cachedPems);

        const claim = this.getAndVerifyClaims(token, key);

        console.log(`claim confirmed for ${claim["cognito:username"]}`);

        return {
            id: claim["cognito:username"],
            claims: claim
        }
    }

    private getCognitoIssuer(): string {
        return "https://cognito-idp." + this.region + ".amazonaws.com/" + this.poolId
    }

    private getPublicKeyUrl(): string {
        return this.cognitoIssuer + "/.well-known/jwks.json";
    }

    private async getPems() {
        const publicKeysResponse = await this.httpClient.request({
            httpMethod: HttpMethod.Get,
            url: this.publicKeyUrl,
        }, {
            responseType: ResponseTypeEnum.Json,
        });

        const publicKeys = publicKeysResponse.body;

        const pems: {[key: string]: string} = publicKeys.keys.reduce((agg, current) => {
            agg[current.kid] = jwkToPem(current);
            return agg;
        }, {} as {[key: string]: string});

        return pems;
    }

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

    private getKeyFromToken(token: string, pems:{[key: string]: string}): string {
        const header = this.getTokenHeader(token);
        const key = pems[header.kid];
        if (key === undefined) {
            throw new Error('Claim made for unknown kid');
        }
        return key;
    }

    private getTokenHeader(token): TokenHeaderInterface {
        const tokenSections = (token || '').split('.');
        if (tokenSections.length < 2) {
            throw new Error('Token is invalid');
        }
        const headerJSON = Buffer.from(tokenSections[0], 'base64').toString('utf8');
        return  JSON.parse(headerJSON) as TokenHeaderInterface;
    }
}
