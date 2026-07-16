import "reflect-metadata";
import {JwtProtectedGuard} from "./jwt-protected.guard";
import {HttpMethod, Request} from "@pristine-ts/common";

describe("JWT Protected Guard", () => {
  it("should return true when the validateAndDecode resolves", async () => {
    const jwtProtectedGuard = new JwtProtectedGuard({
      validateAndDecode: (request: Request): Promise<void> => {
        return Promise.resolve();
      }
    })

    const request = new Request(HttpMethod.Get, "https://url", "uuid")

    expect(await jwtProtectedGuard.isAuthorized(request)).toBeTruthy()
  })

  it("should propagate the error when validateAndDecode rejects, so the AuthorizerManager can surface the precise auth code instead of a generic 403", async () => {
    const thrownError = new Error("invalid token");
    const jwtProtectedGuard = new JwtProtectedGuard({
      validateAndDecode: (request: Request): Promise<void> => {
        return Promise.reject(thrownError);
      }
    })

    const request = new Request(HttpMethod.Get, "https://url", "uuid")

    await expect(jwtProtectedGuard.isAuthorized(request)).rejects.toBe(thrownError);
  })
})
