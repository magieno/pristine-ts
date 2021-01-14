import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class WombatController {
    constructor() {
    }

    @route(HttpMethod.Get, "/wombats")
    public list() {
    }

    @route(HttpMethod.Post, "/wombats")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/wombats/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/wombats/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/wombats/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/wombats/:id")
    public delete(@routeParameter("id") id: string) {
    }
}