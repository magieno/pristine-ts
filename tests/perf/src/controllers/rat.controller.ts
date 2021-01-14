import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class RatController {
    constructor() {
    }

    @route(HttpMethod.Get, "/rats")
    public list() {
    }

    @route(HttpMethod.Post, "/rats")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/rats/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/rats/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/rats/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/rats/:id")
    public delete(@routeParameter("id") id: string) {
    }
}