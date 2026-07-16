import "reflect-metadata";
import {JwtManager} from "./jwt.manager";
import {HttpMethod, Request, TokenExpiredError, UnauthorizedError} from "@pristine-ts/common";
import {JWTKeys} from "../tests/jwt.keys";
import {InvalidJwtError} from "../errors/invalid-jwt.error";
import {JwtAuthorizationHeaderError} from "../errors/jwt-authorization-header.error";
import {sign} from "jsonwebtoken";

describe("JWT Manager", () => {

  it("should decode a valid JWT with private key and no passphrase", async () => {
    const jwtManager = new JwtManager(JWTKeys.RS256.withoutPassphrase.public, "RS256")

    // // JWT Payload:
    // {
    //     "sub": "1234567890",
    //     "name": "Etienne Noel",
    //     "iat": 1516239022
    // }
    const jwt = "eyJraWQiOiI0ZTY1OTJiOC1kYzhhLTQ0ZDUtYjMxOC01ZTBmMGYwMTAwYjMiLCJhbGciOiJSUzI1NiJ9.ew0KICAic3ViIjogIjEyMzQ1Njc4OTAiLA0KICAibmFtZSI6ICJFdGllbm5lIE5vZWwiLA0KICAiaWF0IjogMTUxNjIzOTAyMg0KfQ.X7-qnOsFeyoiCgVzuwc5Yt2D6oNAOAZoY36oy-khcteVlqkvy9jjERAjUXyG_0bBbTu7dtGeq37FbvAXrV7CoeoQgX1c3UHDFabOvAb-BQ1LuPz6R5jSYgBRPbDP38Ai_Hv2Xgls1_7vP6vwwsGpty8Do42w2AZ1Ge8xDTXG0SB25FTIBBu39incSNDGoqL3QDNe7E-R8EbW5Fj40iQBVvFA999tNwYfBCilO8Wmb38dRpRpzDhHw_GDJZj7SOXlsJqfHHEb0rY2kiAS81WDYfxWMQKxSoMt8l7rZ6AezW6YFh_etyQc4eDiPzu-iiQc12enF5wIcwde6GPxaEft_g";

    const request: Request = new Request(HttpMethod.Get, "", "uuid");
    request.setHeaders({
      "Authorization": "Bearer " + jwt,
    })

    const payload = await jwtManager.validateAndDecode(request)

    expect(payload).toStrictEqual({
      "sub": "1234567890",
      "name": "Etienne Noel",
      "iat": 1516239022
    });
  });

  it("shouldn't decode an invalid JWT", async () => {
    const jwtManager = new JwtManager(JWTKeys.RS256.withoutPassphrase.public, "RS256")

    const jwt = "fdsafdsfdsafdsafdasfds";
    const request: Request = new Request(HttpMethod.Get, "", "uuid");
    request.setHeaders({
      "Authorization": "Bearer " + jwt,
    })


    return expect(jwtManager.validateAndDecode(request)).rejects.toBeDefined();
  });

  it("shouldn't decode an invalid Authorization Header", async () => {
    const jwtManager = new JwtManager(JWTKeys.RS256.withoutPassphrase.public, "RS256")

    const jwt = "fdsafdsfdsafdsafdasfds";
    const request: Request = new Request(HttpMethod.Get, "", "uuid");
    request.setHeaders({
      "Authorization": "dsfdafdsafd",
    });

    return expect(jwtManager.validateAndDecode(request)).rejects.toBeDefined();
  });

  it("shouldn't decode a missing Authorization Header", async () => {
    const jwtManager = new JwtManager(JWTKeys.RS256.withoutPassphrase.public, "RS256")

    const jwt = "fdsafdsfdsafdsafdasfds";
    const request: Request = new Request(HttpMethod.Get, "", "uuid");

    return expect(jwtManager.validateAndDecode(request)).rejects.toBeDefined();
  });

  it("should reject an expired JWT with a TokenExpiredError (401 TOKEN_EXPIRED) so the client can refresh", async () => {
    const jwtManager = new JwtManager(JWTKeys.RS256.withoutPassphrase.public, "RS256");

    const expiredJwt = sign({sub: "1234567890"}, JWTKeys.RS256.withoutPassphrase.private, {
      algorithm: "RS256",
      expiresIn: -60, // Issued expired (exp 60s in the past).
    });

    const request: Request = new Request(HttpMethod.Get, "", "uuid");
    request.setHeaders({"Authorization": "Bearer " + expiredJwt});

    await expect(jwtManager.validateAndDecode(request)).rejects.toBeInstanceOf(TokenExpiredError);

    try {
      await jwtManager.validateAndDecode(request);
    } catch (error) {
      expect(error).toBeInstanceOf(TokenExpiredError);
      expect(error).toBeInstanceOf(UnauthorizedError);
      expect((error as TokenExpiredError).options.httpStatus).toBe(401);
      expect((error as TokenExpiredError).options.code).toBe("TOKEN_EXPIRED");
    }
  });

  it("should reject an invalid JWT with an InvalidJwtError mapped to 401 (login, not refresh)", async () => {
    const jwtManager = new JwtManager(JWTKeys.RS256.withoutPassphrase.public, "RS256");

    const request: Request = new Request(HttpMethod.Get, "", "uuid");
    request.setHeaders({"Authorization": "Bearer this.is.notavalidjwt"});

    try {
      await jwtManager.validateAndDecode(request);
      fail("Expected validateAndDecode to reject.");
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidJwtError);
      expect((error as InvalidJwtError).options.httpStatus).toBe(401);
      expect((error as InvalidJwtError).options.code).toBe("UNAUTHORIZED");
    }
  });

  it("should reject a missing Authorization header with a JwtAuthorizationHeaderError mapped to 401", async () => {
    const jwtManager = new JwtManager(JWTKeys.RS256.withoutPassphrase.public, "RS256");

    const request: Request = new Request(HttpMethod.Get, "", "uuid");

    try {
      await jwtManager.validateAndDecode(request);
      fail("Expected validateAndDecode to reject.");
    } catch (error) {
      expect(error).toBeInstanceOf(JwtAuthorizationHeaderError);
      expect((error as JwtAuthorizationHeaderError).options.httpStatus).toBe(401);
      expect((error as JwtAuthorizationHeaderError).options.code).toBe("UNAUTHORIZED");
    }
  });
});
