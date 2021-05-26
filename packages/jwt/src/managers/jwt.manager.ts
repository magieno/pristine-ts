import "reflect-metadata"
import {container, DependencyContainer, inject, injectable, singleton} from "tsyringe";
import {RequestInterface} from "@pristine-ts/common";

import {Algorithm, verify} from "jsonwebtoken"
import {JwtAuthorizationHeaderError} from "../errors/jwt-authorization-header.error";
import {InvalidJwtError} from "../errors/invalid-jwt.error";
import {JwtManagerInterface} from "../interfaces/jwt-manager.interface";

@injectable()
export class JwtManager implements JwtManagerInterface {
    public constructor(
        @inject("%pristine.jwt.publicKey%") private readonly publicKey: string,
        @inject("%pristine.jwt.algorithm%") private readonly algorithm: Algorithm,
        @inject("%pristine.jwt.privateKey%") private readonly privateKey?: string,
        @inject("%pristine.jwt.passphrase%") private readonly passphrase?: string,
    ) {
    }

    private validateRequestAndReturnToken(request: RequestInterface): string {
        if (request.headers === undefined || request.headers.hasOwnProperty("Authorization") === false) {
            throw new JwtAuthorizationHeaderError("The Authorization header wasn't found in the Request.", request);
        }

        const authorizationHeader = request.headers.Authorization;

        if (authorizationHeader === undefined) {
            throw new JwtAuthorizationHeaderError("The Authorization header wasn't found in the Request.", request);
        }

        if (authorizationHeader.startsWith("Bearer ") === false) {
            throw new JwtAuthorizationHeaderError("The value in Authorization header doesn't start with 'Bearer '", request)
        }

        return authorizationHeader.substr(7, authorizationHeader.length);
    }

    public validateAndDecode(request: RequestInterface): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            try {
                const token = this.validateRequestAndReturnToken(request);

                verify(token, this.publicKey, {
                    algorithms: [this.algorithm],
                }, (err, decoded) => {
                    if (err) {
                        return reject(new InvalidJwtError("The JWT is invalid.", err, request, token, this.algorithm, this.publicKey));
                    }

                    return resolve(decoded);
                })

            } catch (e) {
                return reject(e);
            }
        })
    }
}
