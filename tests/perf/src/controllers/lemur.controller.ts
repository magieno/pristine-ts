import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class LemurController {
    constructor() {
    }

    @route(HttpMethod.Get, "/lemurs")
    public list() {
    }

    @route(HttpMethod.Post, "/lemurs")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/lemurs/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/lemurs/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/lemurs/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/lemurs/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
