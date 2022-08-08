import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class WallabyController {
    constructor() {
    }

    @route(HttpMethod.Get, "/wallabys")
    public list() {
    }

    @route(HttpMethod.Post, "/wallabys")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/wallabys/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/wallabys/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/wallabys/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/wallabys/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
