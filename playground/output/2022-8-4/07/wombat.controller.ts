import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

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
