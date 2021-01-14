import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class CraneController {
    constructor() {
    }

    @route(HttpMethod.Get, "/cranes")
    public list() {
    }

    @route(HttpMethod.Post, "/cranes")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/cranes/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/cranes/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/cranes/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/cranes/:id")
    public delete(@routeParameter("id") id: string) {
    }
}