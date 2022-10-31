import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class RailController {
    constructor() {
    }

    @route(HttpMethod.Get, "/rails")
    public list() {
    }

    @route(HttpMethod.Post, "/rails")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/rails/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/rails/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/rails/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/rails/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
