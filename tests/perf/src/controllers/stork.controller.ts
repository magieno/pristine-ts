import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class StorkController {
    constructor() {
    }

    @route(HttpMethod.Get, "/storks")
    public list() {
    }

    @route(HttpMethod.Post, "/storks")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/storks/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/storks/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/storks/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/storks/:id")
    public delete(@routeParameter("id") id: string) {
    }
}