import {injectable, inject, singleton} from "tsyringe";
import {CognitoModuleKeyname} from "../cognito.module.keyname";
import {PublicKeyInterface} from "../interfaces/public-key.interface";
import {HttpClientInterface} from "../interfaces/http-client.interface";
import * as jwkToPem from "jwk-to-pem";
import * as jwt from "jsonwebtoken";
import {RequestInterface} from "@pristine-ts/networking";
import {TokenHeaderInterface} from "../interfaces/token-header.interface";
import {IdentityInterface} from "@pristine-ts/common";
import {ClaimInterface} from "../interfaces/claim.interface";

@singleton()
@injectable()
export class CognitoAuthenticator {

    private cachedPems;

    constructor(@inject(`%${CognitoModuleKeyname}.region%`) private readonly region: string,
                @inject(`%${CognitoModuleKeyname}.poolId%`) private readonly poolId: string,
                private readonly httpClient: HttpClientInterface,
                ) {
    }

    async authenticate(request: RequestInterface): Promise<IdentityInterface> {
        const cognitoIssuer = "https://cognito-idp." + this.region + ".amazonaws.com/" + this.poolId;
        this.cachedPems = this.cachedPems ?? await this.getPems(cognitoIssuer);
        const token = this.validateRequestAndReturnToken(request);
        const key = this.getKeyFromToken(token, this.cachedPems);

        const claim = this.getAndVerifyClaims(token, key, cognitoIssuer);

        console.log(`claim confirmed for ${claim.username}`);

        return {
            id: claim.username, // or maybe cognito:username ?
            claims: claim
        }
    }

    private getAndVerifyClaims(token: string, key: string, cognitoIssuer: string): ClaimInterface {
        let claim;
        try {
            claim = jwt.verify(token, key) as ClaimInterface;
        } catch(err) {
            throw new Error("Invalid jwt");
        }

        const currentSeconds = Math.floor( (new Date()).valueOf() / 1000);
        if (currentSeconds > claim.exp || currentSeconds < claim.auth_time) {
            throw new Error('claim is expired or invalid');
        }
        if (claim.iss !== cognitoIssuer) {
            throw new Error('claim issuer is invalid');
        }
        if (claim.token_use !== 'access') {
            throw new Error('claim use is not access');
        }

        return claim;
    }

    private async getPems(cognitoIssuer: string) {
        const url = cognitoIssuer + "/.well-known/jwks.json";

        const publicKeys = await this.httpClient.get<{keys: PublicKeyInterface[]}>(url);

        const pems: {[key: string]: string} = publicKeys.keys.reduce((agg, current) => {
            agg[current.kid] =  jwkToPem(current);
            return agg;
        }, {} as {[key: string]: string});

        return pems;
    }

    private getKeyFromToken(token: string, pems:{[key: string]: string}): string {
        const header = this.getTokenHeader(token);
        const key = pems[header.kid];
        if (key === undefined) {
            throw new Error('claim made for unknown kid');
        }
        return key;
    }

    private getTokenHeader(token): TokenHeaderInterface {
        const tokenSections = (token || '').split('.');
        if (tokenSections.length < 2) {
            throw new Error('requested token is invalid');
        }
        const headerJSON = Buffer.from(tokenSections[0], 'base64').toString('utf8');
        return  JSON.parse(headerJSON) as TokenHeaderInterface;
    }

    private validateRequestAndReturnToken(request: RequestInterface): string {
        if (request.headers === undefined || request.headers.hasOwnProperty("Authorization") === false) {
            throw new Error("The Authorization header wasn't found in the Request.");
            // throw new MissingAuthorizationHeaderError("The Authorization header wasn't found in the Request.");
        }

        const authorizationHeader = request.headers.Authorization;

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
}
