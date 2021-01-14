import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class ElkController {
    constructor() {
    }

    @route(HttpMethod.Get, "/elks")
    public list() {
    }

    @route(HttpMethod.Post, "/elks")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/elks/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/elks/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/elks/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/elks/:id")
    public delete(@routeParameter("id") id: string) {
    }
}