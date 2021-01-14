import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class StinkbugController {
    constructor() {
    }

    @route(HttpMethod.Get, "/stinkbugs")
    public list() {
    }

    @route(HttpMethod.Post, "/stinkbugs")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/stinkbugs/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/stinkbugs/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/stinkbugs/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/stinkbugs/:id")
    public delete(@routeParameter("id") id: string) {
    }
}