import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class CoyoteController {
    constructor() {
    }

    @route(HttpMethod.Get, "/coyotes")
    public list() {
    }

    @route(HttpMethod.Post, "/coyotes")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/coyotes/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/coyotes/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/coyotes/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/coyotes/:id")
    public delete(@routeParameter("id") id: string) {
    }
}