import "reflect-metadata";
import {RoleGuard} from "./role.guard";
import {HttpMethod} from "@pristine-ts/common";

describe("Auth0 roles Guard", () => {
    it("should return true when no role is needed", async () => {
        const roleGuard = new RoleGuard();

        roleGuard.setContext({
            CognitoGroupGuard: RoleGuard,
            options: {
                groups: []
            }
        })

        expect(await roleGuard.isAuthorized({
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
        const roleGuard = new RoleGuard();

        roleGuard.setContext({
            CognitoGroupGuard: RoleGuard,
            options: {
                roles: ["ADMIN"]
            }
        })

        expect(await roleGuard.isAuthorized({
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
        const roleGuard = new RoleGuard();

        roleGuard.setContext({
            CognitoGroupGuard: RoleGuard,
            options: {
                roles: ["ADMIN"]
            }
        })

        expect(await roleGuard.isAuthorized({
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
        const roleGuard = new RoleGuard();

        roleGuard.setContext({
            CognitoGroupGuard: RoleGuard,
            options: {
                roles: ["ADMIN"]
            }
        })

        expect(await roleGuard.isAuthorized({
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
        const roleGuard = new RoleGuard();

        roleGuard.setContext({
            CognitoGroupGuard: RoleGuard,
            options: {
                roles: ["ADMIN", "USER"]
            }
        })

        expect(await roleGuard.isAuthorized({
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

    it("should return find the claim when specified in options", async () => {
        const roleGuard = new RoleGuard("http://pristine.com/roles");

        roleGuard.setContext({
            CognitoGroupGuard: RoleGuard,
            options: {
                roles: ["ADMIN", "USER"]
            }
        })

        expect(await roleGuard.isAuthorized({
            headers: {},
            httpMethod: HttpMethod.Get,
            url: "https://url",
            body: {},
        }, {
            id: "id",
            claims: {
                "http://pristine.com/roles": ["USER", "ADMIN", "DEVELOPER"]
            }
        })).toBeTruthy()
    })
})
