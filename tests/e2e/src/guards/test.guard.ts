import {injectable} from "tsyringe";
import {GuardContextInterface, GuardInterface} from "@pristine-ts/security";
import {Request} from "@pristine-ts/common";

export class TestGuard implements GuardInterface {
    public keyname = "testGuard"

    public constructor(private readonly shouldAuthorize: boolean) {
    }

    async isAuthorized(request: Request): Promise<boolean> {
        return this.shouldAuthorize;
    }

    setContext(context: any): Promise<void> {
        return Promise.resolve(undefined);
    }

    guardContext: GuardContextInterface;
}
