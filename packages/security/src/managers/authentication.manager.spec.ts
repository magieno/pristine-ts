import "reflect-metadata"
import {LogHandlerInterface, SeverityEnum} from "@pristine-ts/logging";
import {AuthenticationManager} from "./authentication.manager";
import {AuthenticatorContextInterface} from "../interfaces/authenticator-context.interface";
import {AuthenticatorInterface} from "../interfaces/authenticator.interface";
import {IdentityInterface, RequestInterface} from "@pristine-ts/common";
import {container} from "tsyringe";
import {IdentityProviderInterface} from "../interfaces/identity-provider.interface";
import {Span, TracingManagerInterface} from "@pristine-ts/telemetry";

describe("AuthenticationManager", () => {
    const logHandlerMock: LogHandlerInterface = {
        critical(message: string, extra?: any): void {
        }, debug(message: string, extra?: any): void {
        }, error(message: string, extra?: any): void {
        }, info(message: string, extra?: any): void {
        }, warning(message: string, extra?: any): void {
        }
    }

    const tracingManager: TracingManagerInterface = {
        addSpan(span: Span): Span {
            return span;
        }, endSpan(span: Span): any {
        }, endTrace(): any {
        }, startSpan(keyname: string, parentKeyname?: string, context?: { [p: string]: string }): Span {
            return new Span("root");
        }, startTracing(spanRootKeyname?: string, traceId?: string, context?: { [p: string]: string }): Span {
            return new Span("root");
        }

    };

    const requestMock: RequestInterface = {
        httpMethod: "",
        body: {},
        url: "",
        headers: {}
    }

    beforeAll(() => {
        container.register("TracingManagerInterface", {
            useValue: tracingManager,
        });
    })

    it("should return undefined if the routecontext is undefined or if no authenticator is present in the context", async () => {

        const authenticationManager: AuthenticationManager = new AuthenticationManager([], logHandlerMock, {
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

        const authenticationManager: AuthenticationManager = new AuthenticationManager([], logHandlerMock, {
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

    it("should call the setContext method before calling the 'authenticate' method", async () => {
        const identity: IdentityInterface = {
            id: "Id",
            claims: {},
        }

        let index = 0;

        const authenticationManager: AuthenticationManager = new AuthenticationManager([], logHandlerMock, {
            fromContext(authenticatorContext: AuthenticatorContextInterface, container): AuthenticatorInterface {
                return {
                    setContext(context: any): Promise<void> {
                        expect(index).toBe(0);
                        index++;

                        return Promise.resolve();
                    },
                    authenticate(request: RequestInterface): Promise<IdentityInterface | undefined> {
                        expect(index).toBe(1);
                        return Promise.resolve(identity);
                    }
                };
            }
        })

        await authenticationManager.authenticate(requestMock, {
            authenticator: {}
        }, container);

        expect.assertions(2);
    })

    it("should call the identity provider.", async () => {
        const identity: IdentityInterface = {
            id: "Id",
            claims: {},
        }

        const identityProvider: IdentityProviderInterface = {
            provide: (identity: IdentityInterface): Promise<IdentityInterface> => {
                return Promise.resolve(identity);
            }
        }

        const spy = jest.spyOn(identityProvider, "provide");

        const authenticationManager: AuthenticationManager = new AuthenticationManager([identityProvider], logHandlerMock, {
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

        await authenticationManager.authenticate(requestMock, {
            authenticator: {}
        }, container);

        expect(spy).toHaveBeenCalled()
    })
})
