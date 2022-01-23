import "reflect-metadata";
import {AwsCognitoGroupGuard} from "./aws-cognito-group.guard";
import {HttpMethod, Request} from "@pristine-ts/common";

describe("AWS Cognito group Guard", () => {
    it("should return true when no group is needed", async () => {
        const cognitoGroupGuard = new AwsCognitoGroupGuard();

        cognitoGroupGuard.setContext({
            CognitoGroupGuard: AwsCognitoGroupGuard,
            options: {
                groups: []
            }
        })

        const request = new Request(HttpMethod.Get, "https://url");

        expect(await cognitoGroupGuard.isAuthorized(request, {
            id: "id",
            claims: {
                "cognito:groups": ["ADMIN"]
            }
        })).toBeTruthy()
    })

    it("should return false when groups are needed but identity does not provide groups.", async () => {
        const cognitoGroupGuard = new AwsCognitoGroupGuard();

        cognitoGroupGuard.setContext({
            CognitoGroupGuard: AwsCognitoGroupGuard,
            options: {
                groups: ["ADMIN"]
            }
        })

        const request = new Request(HttpMethod.Get, "https://url");

        expect(await cognitoGroupGuard.isAuthorized(request, {
            id: "id",
            claims: {
            }
        })).toBeFalsy()
    })

    it("should return false when groups are needed but identity groups is not an array.", async () => {
        const cognitoGroupGuard = new AwsCognitoGroupGuard();

        cognitoGroupGuard.setContext({
            CognitoGroupGuard: AwsCognitoGroupGuard,
            options: {
                groups: ["ADMIN"]
            }
        })

        const request = new Request(HttpMethod.Get, "https://url");

        expect(await cognitoGroupGuard.isAuthorized(request, {
            id: "id",
            claims: {
                "cognito:groups": {}
            }
        })).toBeFalsy()
    })

    it("should return false when groups are needed that are not in the identity groups.", async () => {
        const cognitoGroupGuard = new AwsCognitoGroupGuard();

        cognitoGroupGuard.setContext({
            CognitoGroupGuard: AwsCognitoGroupGuard,
            options: {
                groups: ["ADMIN"]
            }
        })

        const request = new Request(HttpMethod.Get, "https://url");

        expect(await cognitoGroupGuard.isAuthorized(request, {
            id: "id",
            claims: {
                "cognito:groups": ["USER"]
            }
        })).toBeFalsy()
    })

    it("should return true when all groups needed are in the identity groups.", async () => {
        const cognitoGroupGuard = new AwsCognitoGroupGuard();

        cognitoGroupGuard.setContext({
            CognitoGroupGuard: AwsCognitoGroupGuard,
            options: {
                groups: ["ADMIN", "USER"]
            }
        })

        const request = new Request(HttpMethod.Get, "https://url");

        expect(await cognitoGroupGuard.isAuthorized(request, {
            id: "id",
            claims: {
                "cognito:groups": ["USER", "ADMIN", "DEVELOPER"]
            }
        })).toBeTruthy()
    })
})
