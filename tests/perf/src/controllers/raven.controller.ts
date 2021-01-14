import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class RavenController {
    constructor() {
    }

    @route(HttpMethod.Get, "/ravens")
    public list() {
    }

    @route(HttpMethod.Post, "/ravens")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/ravens/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/ravens/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/ravens/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/ravens/:id")
    public delete(@routeParameter("id") id: string) {
    }
}