import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class PonyController {
    constructor() {
    }

    @route(HttpMethod.Get, "/ponys")
    public list() {
    }

    @route(HttpMethod.Post, "/ponys")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/ponys/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/ponys/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/ponys/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/ponys/:id")
    public delete(@routeParameter("id") id: string) {
    }
}