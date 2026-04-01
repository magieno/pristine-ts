import "reflect-metadata"
import {GuardFactory} from "./guard.factory";
import {container, injectable} from "tsyringe";
import {GuardInterface} from "../interfaces/guard.interface";
import {GuardContextInterface} from "../interfaces/guard-context.interface";
import {IdentityInterface, Request} from "@pristine-ts/common";
import {GuardInstantiationError} from "../errors/guard-instantiation.error";

describe("Guard Factory", () => {
  @injectable()
  class Guard implements GuardInterface {
    guardContext: GuardContextInterface;
    keyname: string;

    isAuthorized(request: Request, identity?: IdentityInterface): Promise<boolean> {
      return Promise.resolve(false);
    }

    setContext(context: any): Promise<void> {
      return Promise.resolve(undefined);
    }
  }

  it("should resolve from the container if the context provides a function", () => {
    const guardFactory = new GuardFactory();

    const spy = jest.spyOn(container, "resolve");

    guardFactory.fromContext({
      guard: Guard,
      constructorName: "guard",
      options: {},
    }, container);

    expect(spy).toHaveBeenCalled()
  })

  it("should throw when the guard doesn't implement the 'isAuthorized' method", () => {
    const guardFactory = new GuardFactory();

    expect(() => guardFactory.fromContext({
      //@ts-ignore
      guard: {
        setContext(context: any): Promise<void> {
          return Promise.resolve();
        }
      },
      constructorName: "guard",
      options: {},
    }, container)).toThrow(GuardInstantiationError);
  })

  it("should throw when the guard doesn't implement the 'setContext' method", () => {
    const guardFactory = new GuardFactory();

    expect(() => guardFactory.fromContext({
      //@ts-ignore
      guard: {
        isAuthorized(request: Request, identity?: IdentityInterface): Promise<boolean> {
          return Promise.resolve(true);
        }
      },
      constructorName: "guard",
      options: {},
    }, container)).toThrow(GuardInstantiationError);
  })
})
