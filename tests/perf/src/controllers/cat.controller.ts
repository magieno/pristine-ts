import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class CatController {
    constructor() {
    }

    @route(HttpMethod.Get, "/cats")
    public list() {
    }

    @route(HttpMethod.Post, "/cats")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/cats/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/cats/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/cats/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/cats/:id")
    public delete(@routeParameter("id") id: string) {
    }
}