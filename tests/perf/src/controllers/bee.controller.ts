import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class BeeController {
    constructor() {
    }

    @route(HttpMethod.Get, "/bees")
    public list() {
    }

    @route(HttpMethod.Post, "/bees")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/bees/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/bees/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/bees/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/bees/:id")
    public delete(@routeParameter("id") id: string) {
    }
}