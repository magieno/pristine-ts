import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class OryxController {
    constructor() {
    }

    @route(HttpMethod.Get, "/oryxs")
    public list() {
    }

    @route(HttpMethod.Post, "/oryxs")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/oryxs/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/oryxs/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/oryxs/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/oryxs/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
