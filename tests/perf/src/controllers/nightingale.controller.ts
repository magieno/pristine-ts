import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class NightingaleController {
    constructor() {
    }

    @route(HttpMethod.Get, "/nightingales")
    public list() {
    }

    @route(HttpMethod.Post, "/nightingales")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/nightingales/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/nightingales/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/nightingales/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/nightingales/:id")
    public delete(@routeParameter("id") id: string) {
    }
}