import {injectable} from "tsyringe";
import {GuardInterface} from "@pristine-ts/security";
import {RequestInterface} from "@pristine-ts/common";

export class TestGuard implements GuardInterface {
    public keyname = "testGuard"

    public constructor(private readonly shouldAuthorize: boolean) {
    }

    async isAuthorized(request: RequestInterface): Promise<boolean> {
        return this.shouldAuthorize;
    }

    setContext(context: any): Promise<void> {
        return Promise.resolve(undefined);
    }
}
