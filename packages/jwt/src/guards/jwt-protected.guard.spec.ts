import "reflect-metadata";
import {JwtProtectedGuard} from "./jwt-protected.guard";
import {MethodRouterNode, PathRouterNode, Route} from "@pristine-ts/networking";
import {HttpMethod, RequestInterface} from "@pristine-ts/common";

describe("JWT Protected Guard", () => {
    it("should return true when the validateAndDecode resolves", async () => {
        const jwtProtectedGuard = new JwtProtectedGuard({
            validateAndDecode: (request: RequestInterface): Promise<void> => {
                return Promise.resolve();
            }
        })

        expect(await jwtProtectedGuard.isAuthorized({
            headers: {},
            httpMethod: HttpMethod.Get,
            url: "https://url",
            body: {},
        })).toBeTruthy()
    })

    it("should return false when the validateAndDecode rejects", async () => {
        const jwtProtectedGuard = new JwtProtectedGuard({
            validateAndDecode: (request: RequestInterface): Promise<void> => {
                return Promise.reject(new Error());
            }
        })

        expect(await jwtProtectedGuard.isAuthorized({
            headers: {},
            httpMethod: HttpMethod.Get,
            url: "https://url",
            body: {},
        })).toBeFalsy()
    })
})
