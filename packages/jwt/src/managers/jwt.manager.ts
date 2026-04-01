import "reflect-metadata"
import {inject, injectable} from "tsyringe";
import {moduleScoped, Request, tag} from "@pristine-ts/common";

import {Algorithm, verify} from "jsonwebtoken"
import {JwtAuthorizationHeaderError} from "../errors/jwt-authorization-header.error";
import {InvalidJwtError} from "../errors/invalid-jwt.error";
import {JwtManagerInterface} from "../interfaces/jwt-manager.interface";
import {JwtModuleKeyname} from "../jwt.module.keyname";

/**
 * The JwtManager makes decodes and validates JWT token so that they can be used.
 */
@moduleScoped(JwtModuleKeyname)
@tag("JwtManagerInterface")
@injectable()
export class JwtManager implements JwtManagerInterface {
  /**
   * The JwtManager makes decodes and validates JWT token so that they can be used.
   * @param publicKey The public key to use to validate the JWT token.
   * @param algorithm The algorithm to use to decode the JWT token.
   * @param privateKey
   * @param passphrase
   */
  public constructor(
    @inject("%pristine.jwt.publicKey%") private readonly publicKey: string,
    @inject("%pristine.jwt.algorithm%") private readonly algorithm: Algorithm,
    @inject("%pristine.jwt.privateKey%") private readonly privateKey?: string,
    @inject("%pristine.jwt.passphrase%") private readonly passphrase?: string,
  ) {
  }

  /**
   * Validates that the request is authorized by validating the JWT and returning the decoded JWT.
   * @param request The request to validate that contains the JWT.
   */
  public validateAndDecode(request: Request): Promise<any> {
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

  /**
   * Validates that the request contains the Authorization and that it is properly formed and returns the JWT.
   * @param request The request to validate.
   * @private
   */
  private validateRequestAndReturnToken(request: Request): string {
    if (request.headers === undefined || request.hasHeader("Authorization") === false) {
      throw new JwtAuthorizationHeaderError("The Authorization header wasn't found in the Request.", request);
    }

    const authorizationHeader = request.getHeader("Authorization");

    if (authorizationHeader === undefined) {
      throw new JwtAuthorizationHeaderError("The Authorization header wasn't found in the Request.", request);
    }

    if (authorizationHeader.startsWith("Bearer ") === false) {
      throw new JwtAuthorizationHeaderError("The value in Authorization header doesn't start with 'Bearer '", request)
    }

    return authorizationHeader.substr(7, authorizationHeader.length);
  }
}
