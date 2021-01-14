import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class WaspController {
    constructor() {
    }

    @route(HttpMethod.Get, "/wasps")
    public list() {
    }

    @route(HttpMethod.Post, "/wasps")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/wasps/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/wasps/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/wasps/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/wasps/:id")
    public delete(@routeParameter("id") id: string) {
    }
}