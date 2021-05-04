import "reflect-metadata"
import {container, injectable} from "tsyringe";
import {AuthenticatorInterface} from "../interfaces/authenticator.interface";
import {IdentityInterface, RequestInterface} from "@pristine-ts/common";
import {AuthenticatorFactory} from "./authenticator.factory";
import {AuthenticatorInitializationError} from "../errors/authenticator-initialization.error";
import {GuardFactory} from "./guard.factory";
import {GuardInitializationError} from "../errors/guard-initialization.error";

describe("Authenticator Factory", () => {
    @injectable()
    class Authenticator implements AuthenticatorInterface {
        authenticate(request: RequestInterface): Promise<IdentityInterface | undefined> {
            return Promise.resolve(undefined);
        }

        setContext(context: any): Promise<void> {
            return Promise.resolve(undefined);
        }
    }

    it("should resolve from the container if the context provides a function", () => {
        const authenticatorFactory = new AuthenticatorFactory();

        const spy = jest.spyOn(container, "resolve");

        authenticatorFactory.fromContext({
            authenticator: Authenticator,
            constructorName: "Authenticator",
            options: {},
        }, container);

        expect(spy).toHaveBeenCalled()
    })

    it("should throw when the authenticator doesn't implement the 'authenticate' method", () => {
        const authenticatorFactory = new AuthenticatorFactory();

        expect(() => authenticatorFactory.fromContext({
            //@ts-ignore
            authenticator: {
                setContext(context: any): Promise<void> {
                    return Promise.resolve();
                }
            },
            constructorName: "authenticator",
            options: {},
        }, container)).toThrow(AuthenticatorInitializationError);
    })

    it("should throw when the authenticator doesn't implement the 'setContext' method", () => {
        const authenticatorFactory = new AuthenticatorFactory();

        expect(() => authenticatorFactory.fromContext({
            //@ts-ignore
            authenticator: {
                authenticate(request: RequestInterface): Promise<IdentityInterface | undefined> {
                    return Promise.resolve(undefined);
                }
            },
            constructorName: "authenticator",
            options: {},
        }, container)).toThrow(AuthenticatorInitializationError);
    })
})
