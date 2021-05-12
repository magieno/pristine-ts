import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class WhaleController {
    constructor() {
    }

    @route(HttpMethod.Get, "/whales")
    public list() {
    }

    @route(HttpMethod.Post, "/whales")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/whales/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/whales/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/whales/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/whales/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
