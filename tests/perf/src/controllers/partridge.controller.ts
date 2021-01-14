import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class PartridgeController {
    constructor() {
    }

    @route(HttpMethod.Get, "/partridges")
    public list() {
    }

    @route(HttpMethod.Post, "/partridges")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/partridges/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/partridges/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/partridges/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/partridges/:id")
    public delete(@routeParameter("id") id: string) {
    }
}