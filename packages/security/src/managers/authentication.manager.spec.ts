import "reflect-metadata"
import {LogHandlerInterface, SeverityEnum} from "@pristine-ts/logging";
import {AuthenticationManager} from "./authentication.manager";
import {AuthenticatorContextInterface} from "../interfaces/authenticator-context.interface";
import {AuthenticatorInterface} from "../interfaces/authenticator.interface";
import {IdentityInterface, RequestInterface} from "@pristine-ts/common";
import {container} from "tsyringe";

describe("AuthenticationManager", () => {
    const logHandlerMock: LogHandlerInterface = {
        critical(message: string, extra?: any): void {
        }, debug(message: string, extra?: any): void {
        }, error(message: string, extra?: any): void {
        }, info(message: string, extra?: any): void {
        }, log(message: string, severity: SeverityEnum, extra?: any): void {
        }, warning(message: string, extra?: any): void {
        }
    }

    const requestMock: RequestInterface = {
        httpMethod: "",
        body: {},
        url: "",
        headers: {}
    }

    it("should return undefined if the routecontext is undefined or if no authenticator is present in the context", async () => {

        const authenticationManager: AuthenticationManager = new AuthenticationManager(logHandlerMock, {
            fromContext(authenticatorContext: AuthenticatorContextInterface, container): AuthenticatorInterface {
                return {
                    setContext(context: any): Promise<void> {
                        return Promise.resolve();
                    },
                    authenticate(request: RequestInterface): Promise<IdentityInterface | undefined> {
                        return Promise.resolve(undefined)
                    }
                };
            }
        })

        expect(await authenticationManager.authenticate(requestMock, undefined, container)).toBeUndefined()
        expect(await authenticationManager.authenticate(requestMock, {
            authenticator: undefined,
        }, container)).toBeUndefined()
    })

    it("should return the Identity returned by the configured authenticator in the context", async () => {
        const identity: IdentityInterface = {
            id: "Id",
            claims: {},
        }

        const authenticationManager: AuthenticationManager = new AuthenticationManager(logHandlerMock, {
            fromContext(authenticatorContext: AuthenticatorContextInterface, container): AuthenticatorInterface {
                return {
                    setContext(context: any): Promise<void> {
                        return Promise.resolve();
                    },
                    authenticate(request: RequestInterface): Promise<IdentityInterface | undefined> {
                        return Promise.resolve(identity);
                    }
                };
            }
        })

        expect(await authenticationManager.authenticate(requestMock, {
            authenticator: {}
        }, container)).toBe(identity)
    })

    it("should call the setContext method before calling the 'authenticate' method", () => {

    })
})
