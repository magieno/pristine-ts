import {injectable} from "tsyringe";
import {GuardInterface, RequestInterface} from "@pristine-ts/networking";

export class TestGuard implements GuardInterface {
    public keyname = "testGuard"

    public constructor(private readonly shouldAuthorize: boolean) {
    }

    async isAuthorized(request: RequestInterface): Promise<boolean> {
        return this.shouldAuthorize;
    }
}