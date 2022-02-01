import "reflect-metadata"
import {container, injectable} from "tsyringe";
import {AuthenticatorInterface} from "../interfaces/authenticator.interface";
import {IdentityInterface} from "@pristine-ts/common";
import {AuthenticatorFactory} from "./authenticator.factory";
import {AuthenticatorInstantiationError} from "../errors/authenticator-instantiation.error";
import {GuardFactory} from "./guard.factory";
import {GuardDecoratorError} from "../errors/guard-decorator.error";
import {Request} from "@pristine-ts/common";


describe("Authenticator Factory", () => {
    @injectable()
    class Authenticator implements AuthenticatorInterface {
        authenticate(request: Request): Promise<IdentityInterface | undefined> {
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
        }, container)).toThrow(AuthenticatorInstantiationError);
    })

    it("should throw when the authenticator doesn't implement the 'setContext' method", () => {
        const authenticatorFactory = new AuthenticatorFactory();

        expect(() => authenticatorFactory.fromContext({
            //@ts-ignore
            authenticator: {
                authenticate(request: Request): Promise<IdentityInterface | undefined> {
                    return Promise.resolve(undefined);
                }
            },
            constructorName: "authenticator",
            options: {},
        }, container)).toThrow(AuthenticatorInstantiationError);
    })
})
