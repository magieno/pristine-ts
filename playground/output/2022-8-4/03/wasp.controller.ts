import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

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
