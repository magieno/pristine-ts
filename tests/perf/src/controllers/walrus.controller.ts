import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class WalrusController {
    constructor() {
    }

    @route(HttpMethod.Get, "/walruss")
    public list() {
    }

    @route(HttpMethod.Post, "/walruss")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/walruss/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/walruss/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/walruss/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/walruss/:id")
    public delete(@routeParameter("id") id: string) {
    }
}