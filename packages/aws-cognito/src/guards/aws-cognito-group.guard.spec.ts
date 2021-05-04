import "reflect-metadata";
import {AwsCognitoGroupGuard} from "./aws-cognito-group.guard";
import {HttpMethod} from "@pristine-ts/networking";

describe("AWS Cognito group Guard", () => {
    it("should return true when no group is needed", async () => {
        const cognitoGroupGuard = new AwsCognitoGroupGuard();

        cognitoGroupGuard.setContext({
            CognitoGroupGuard: AwsCognitoGroupGuard,
            options: {
                groups: []
            }
        })

        expect(await cognitoGroupGuard.isAuthorized({
            headers: {},
            httpMethod: HttpMethod.Get,
            url: "https://url",
            body: {},
        }, {
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

        expect(await cognitoGroupGuard.isAuthorized({
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
        const cognitoGroupGuard = new AwsCognitoGroupGuard();

        cognitoGroupGuard.setContext({
            CognitoGroupGuard: AwsCognitoGroupGuard,
            options: {
                groups: ["ADMIN"]
            }
        })

        expect(await cognitoGroupGuard.isAuthorized({
            headers: {},
            httpMethod: HttpMethod.Get,
            url: "https://url",
            body: {},
        }, {
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

        expect(await cognitoGroupGuard.isAuthorized({
            headers: {},
            httpMethod: HttpMethod.Get,
            url: "https://url",
            body: {},
        }, {
            id: "id",
            claims: {
                "cognito:groups": ["USER"]
            }
        })).toBeTruthy()
    })

    it("should return true when all groups needed are in the identity groups.", async () => {
        const cognitoGroupGuard = new AwsCognitoGroupGuard();

        cognitoGroupGuard.setContext({
            CognitoGroupGuard: AwsCognitoGroupGuard,
            options: {
                groups: ["ADMIN", "USER"]
            }
        })

        expect(await cognitoGroupGuard.isAuthorized({
            headers: {},
            httpMethod: HttpMethod.Get,
            url: "https://url",
            body: {},
        }, {
            id: "id",
            claims: {
                "cognito:groups": ["USER", "ADMIN", "DEVELOPER"]
            }
        })).toBeTruthy()
    })
})
