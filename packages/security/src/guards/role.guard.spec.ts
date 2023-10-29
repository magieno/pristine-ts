import "reflect-metadata";
import {RoleGuard} from "./role.guard";
import {HttpMethod, Request} from "@pristine-ts/common";
import {LogHandlerInterface} from "@pristine-ts/logging";

class LogHandlerMock implements LogHandlerInterface {
    debug(message: string, extra?: any) {
    }

    info(message: string, extra?: any) {
    }

    error(message: string, extra?: any) {
    }

    critical(message: string, extra?: any) {
    }

    warning(message: string, extra?: any) {
    }

    terminate() {

    }
}

describe("Auth0 roles Guard", () => {
    it("should return true when no role is needed", async () => {
        const roleGuard = new RoleGuard("http://pristine.com/roles", new LogHandlerMock());

        roleGuard.setContext({
            CognitoGroupGuard: RoleGuard,
            options: {
                groups: []
            }
        })

        const request = new Request(HttpMethod.Get, "https://url");

        expect(await roleGuard.isAuthorized(request, {
            id: "id",
            claims: {
            }
        })).toBeTruthy()
    })

    it("should return false when groups are needed but identity does not provide groups.", async () => {
        const roleGuard = new RoleGuard("http://pristine.com/roles", new LogHandlerMock());

        roleGuard.setContext({
            CognitoGroupGuard: RoleGuard,
            options: {
                roles: ["ADMIN"]
            }
        })

        const request = new Request(HttpMethod.Get, "https://url");

        expect(await roleGuard.isAuthorized(request, {
            id: "id",
            claims: {
            }
        })).toBeFalsy()
    })

    it("should return false when groups are needed but identity groups is not an array.", async () => {
        const roleGuard = new RoleGuard("http://pristine.com/roles", new LogHandlerMock());

        roleGuard.setContext({
            CognitoGroupGuard: RoleGuard,
            options: {
                roles: ["ADMIN"]
            }
        })

        const request = new Request(HttpMethod.Get, "https://url");

        expect(await roleGuard.isAuthorized(request, {
            id: "id",
            claims: {
                "roles": {}
            }
        })).toBeFalsy()
    })

    it("should return false when groups are needed that are not in the identity groups.", async () => {
        const roleGuard = new RoleGuard("http://pristine.com/roles", new LogHandlerMock());

        roleGuard.setContext({
            CognitoGroupGuard: RoleGuard,
            options: {
                roles: ["ADMIN"]
            }
        })

        const request = new Request(HttpMethod.Get, "https://url");

        expect(await roleGuard.isAuthorized(request, {
            id: "id",
            claims: {
                "http://pristine.com/roles": ["USER"]
            }
        })).toBeFalsy()
    })

    it("should return true when all groups needed are in the identity groups.", async () => {
        const roleGuard = new RoleGuard("http://pristine.com/roles", new LogHandlerMock());

        roleGuard.setContext({
            CognitoGroupGuard: RoleGuard,
            options: {
                roles: ["ADMIN", "USER"]
            }
        })

        const request = new Request(HttpMethod.Get, "https://url");

        expect(await roleGuard.isAuthorized(request, {
            id: "id",
            claims: {
                "http://pristine.com/roles": ["USER", "ADMIN", "DEVELOPER"]
            }
        })).toBeTruthy()
    })

    it("should return find the claim when specified in options", async () => {
        const roleGuard = new RoleGuard("http://pristine.com/roles", new LogHandlerMock());

        roleGuard.setContext({
            CognitoGroupGuard: RoleGuard,
            options: {
                roles: ["ADMIN", "USER"]
            }
        })

        const request = new Request(HttpMethod.Get, "https://url");

        expect(await roleGuard.isAuthorized(request, {
            id: "id",
            claims: {
                "http://pristine.com/roles": ["USER", "ADMIN", "DEVELOPER"]
            }
        })).toBeTruthy()
    })
})
