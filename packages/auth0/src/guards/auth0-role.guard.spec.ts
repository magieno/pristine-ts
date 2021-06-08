import "reflect-metadata";
import {Auth0RoleGuard} from "./auth0-role.guard";
import {HttpMethod} from "@pristine-ts/common";

describe("Auth0 roles Guard", () => {
    it("should return true when no role is needed", async () => {
        const auth0RolesGuard = new Auth0RoleGuard();

        auth0RolesGuard.setContext({
            CognitoGroupGuard: Auth0RoleGuard,
            options: {
                groups: []
            }
        })

        expect(await auth0RolesGuard.isAuthorized({
            headers: {},
            httpMethod: HttpMethod.Get,
            url: "https://url",
            body: {},
        }, {
            id: "id",
            claims: {
            }
        })).toBeTruthy()
    })

    it("should return false when groups are needed but identity does not provide groups.", async () => {
        const auth0RolesGuard = new Auth0RoleGuard();

        auth0RolesGuard.setContext({
            CognitoGroupGuard: Auth0RoleGuard,
            options: {
                roles: ["ADMIN"]
            }
        })

        expect(await auth0RolesGuard.isAuthorized({
            headers: {},
            httpMethod: HttpMethod.Get,
            url: "https://url",
            body: {},
        }, {
            id: "id",
            claims: {
            }
        })).toBeFalsy()
    })

    it("should return false when groups are needed but identity groups is not an array.", async () => {
        const auth0RolesGuard = new Auth0RoleGuard();

        auth0RolesGuard.setContext({
            CognitoGroupGuard: Auth0RoleGuard,
            options: {
                roles: ["ADMIN"]
            }
        })

        expect(await auth0RolesGuard.isAuthorized({
            headers: {},
            httpMethod: HttpMethod.Get,
            url: "https://url",
            body: {},
        }, {
            id: "id",
            claims: {
                "roles": {}
            }
        })).toBeFalsy()
    })

    it("should return false when groups are needed that are not in the identity groups.", async () => {
        const auth0RolesGuard = new Auth0RoleGuard();

        auth0RolesGuard.setContext({
            CognitoGroupGuard: Auth0RoleGuard,
            options: {
                roles: ["ADMIN"]
            }
        })

        expect(await auth0RolesGuard.isAuthorized({
            headers: {},
            httpMethod: HttpMethod.Get,
            url: "https://url",
            body: {},
        }, {
            id: "id",
            claims: {
                "roles": ["USER"]
            }
        })).toBeFalsy()
    })

    it("should return true when all groups needed are in the identity groups.", async () => {
        const auth0RolesGuard = new Auth0RoleGuard();

        auth0RolesGuard.setContext({
            CognitoGroupGuard: Auth0RoleGuard,
            options: {
                roles: ["ADMIN", "USER"]
            }
        })

        expect(await auth0RolesGuard.isAuthorized({
            headers: {},
            httpMethod: HttpMethod.Get,
            url: "https://url",
            body: {},
        }, {
            id: "id",
            claims: {
                "roles": ["USER", "ADMIN", "DEVELOPER"]
            }
        })).toBeTruthy()
    })
})
