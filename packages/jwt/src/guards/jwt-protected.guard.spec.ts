import "reflect-metadata";
import {JwtProtectedGuard} from "./jwt-protected.guard";
import {MethodRouterNode, PathRouterNode, Route} from "@pristine-ts/networking";
import {HttpMethod, Request} from "@pristine-ts/common";

describe("JWT Protected Guard", () => {
    it("should return true when the validateAndDecode resolves", async () => {
        const jwtProtectedGuard = new JwtProtectedGuard({
            validateAndDecode: (request: Request): Promise<void> => {
                return Promise.resolve();
            }
        })

        const request = new Request( HttpMethod.Get, "https://url")

        expect(await jwtProtectedGuard.isAuthorized(request)).toBeTruthy()
    })

    it("should return false when the validateAndDecode rejects", async () => {
        const jwtProtectedGuard = new JwtProtectedGuard({
            validateAndDecode: (request: Request): Promise<void> => {
                return Promise.reject(new Error());
            }
        })

        const request = new Request( HttpMethod.Get, "https://url")

        expect(await jwtProtectedGuard.isAuthorized(request)).toBeFalsy()
    })
})
