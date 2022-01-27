import "reflect-metadata"
import {container, injectable} from "tsyringe";
import {AuthorizerManager} from "./authorizer.manager";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {IdentityInterface, Request} from "@pristine-ts/common";
import {GuardFactory} from "../factories/guard.factory";
import {GuardInterface} from "../interfaces/guard.interface";
import {GuardContextInterface} from "../interfaces/guard-context.interface";

describe("AuthorizerManager", () => {
    const logHandlerMock: LogHandlerInterface = {
        critical(message: string, extra?: any): void {
        }, debug(message: string, extra?: any): void {
        }, error(message: string, extra?: any): void {
        }, info(message: string, extra?: any): void {
        }, warning(message: string, extra?: any): void {
        }, terminate() {
        }
    }

    const requestMock: Request = new Request("", "");
    requestMock.body = {};
    requestMock.headers = {};

    @injectable()
    class Guard1 implements GuardInterface {
        guardContext: GuardContextInterface;
        keyname: string;

        isAuthorized(request: Request, identity?: IdentityInterface): Promise<boolean> {
            return Promise.resolve(true);
        }

        setContext(context: any): Promise<void> {
            return Promise.resolve(undefined);
        }

    }

    @injectable()
    class Guard2 implements GuardInterface {
        guardContext: GuardContextInterface;
        keyname: string;

        isAuthorized(request: Request, identity?: IdentityInterface): Promise<boolean> {
            return Promise.resolve(true);
        }

        setContext(context: any): Promise<void> {
            return Promise.resolve(undefined);
        }

    }

    it("should authorize if there are no guards defined in the context or if the route context is not properly defined", () => {
        const authorizerManager = new AuthorizerManager(logHandlerMock, new GuardFactory());

        expect(authorizerManager.isAuthorized(requestMock, {}, container)).toBeTruthy()
    })

    it("should call every single guards defined in the RouteContext", async () => {
        const authorizerManager = new AuthorizerManager(logHandlerMock, {
            fromContext(guardContext: GuardContextInterface, container): GuardInterface {
                // @ts-ignore
                return guardContext.guard;
            }
        });

        const guard1 = new Guard1();
        const spy1 = jest.spyOn(guard1, "isAuthorized");


        const guard2 = new Guard2();
        const spy2 = jest.spyOn(guard2, "isAuthorized");

        const guardContext1: GuardContextInterface = {
            // @ts-ignore
            guard: guard1,
            constructorName: Guard1.name,
            options: {},
        }


        const guardContext2: GuardContextInterface = {
            // @ts-ignore
            guard: guard2,
            constructorName: Guard2.name,
            options: {},
        }

        await authorizerManager.isAuthorized(requestMock, {
            guards: [guardContext1, guardContext2],
        }, container);

        expect(spy1).toHaveBeenCalled()
        expect(spy2).toHaveBeenCalled()
    })

    it("should deny the authorization even if only one of many guards denies access", async () => {
        const authorizerManager = new AuthorizerManager(logHandlerMock, {
            fromContext(guardContext: GuardContextInterface, container): GuardInterface {
                // @ts-ignore
                return guardContext.guard;
            }
        });

        const guard1 = new Guard1();
        const spy1 = jest.spyOn(guard1, "isAuthorized");
        spy1.mockImplementation((request: Request, identity?: IdentityInterface) => {
            return Promise.resolve(false)
        })

        const guard2 = new Guard2();
        const spy2 = jest.spyOn(guard2, "isAuthorized");
        spy2.mockImplementation((request: Request, identity?: IdentityInterface) => {
            return Promise.resolve(true)
        })

        const guardContext1: GuardContextInterface = {
            // @ts-ignore
            guard: guard1,
            constructorName: Guard1.name,
            options: {},
        }

        const guardContext2: GuardContextInterface = {
            // @ts-ignore
            guard: guard2,
            constructorName: Guard2.name,
            options: {},
        }

       expect(await authorizerManager.isAuthorized(requestMock, {
            guards: [guardContext1, guardContext2],
        }, container)).toBeFalsy();

    })

    it("should deny if one guard throws an exception", async () => {
        const authorizerManager = new AuthorizerManager(logHandlerMock, {
            fromContext(guardContext: GuardContextInterface, container): GuardInterface {
                // @ts-ignore
                return guardContext.guard;
            }
        });

        const guard1 = new Guard1();
        const spy1 = jest.spyOn(guard1, "isAuthorized");
        spy1.mockImplementation((request: Request, identity?: IdentityInterface) => {
            return Promise.reject(new Error())
        })

        const guard2 = new Guard2();
        const spy2 = jest.spyOn(guard2, "isAuthorized");
        spy2.mockImplementation((request: Request, identity?: IdentityInterface) => {
            return Promise.resolve(true)
        })

        const guardContext1: GuardContextInterface = {
            // @ts-ignore
            guard: guard1,
            constructorName: Guard1.name,
            options: {},
        }

        const guardContext2: GuardContextInterface = {
            // @ts-ignore
            guard: guard2,
            constructorName: Guard2.name,
            options: {},
        }

        expect(await authorizerManager.isAuthorized(requestMock, {
            guards: [guardContext1, guardContext2],
        }, container)).toBeFalsy();
    })

    it("should call the setContext method before calling the 'isAuthorized' method", async () => {
        const identity: IdentityInterface = {
            id: "Id",
            claims: {},
        }

        let index = 0;

        const authorizerManager = new AuthorizerManager(logHandlerMock, {
            fromContext(guardContext: GuardContextInterface, container): GuardInterface {
                // @ts-ignore
                return {
                    setContext(context: any): Promise<void> {
                        expect(index).toBe(0);
                        index++;

                        return Promise.resolve();
                    },
                    isAuthorized(request: Request, identity?: IdentityInterface): Promise<boolean> {
                        expect(index).toBe(1);
                        return Promise.resolve(true);
                    }
                };
            }
        });

        await authorizerManager.isAuthorized(requestMock, {
            guards: [{}],
        }, container);

        expect.assertions(2);
    })
})
