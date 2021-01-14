import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class WormController {
    constructor() {
    }

    @route(HttpMethod.Get, "/worms")
    public list() {
    }

    @route(HttpMethod.Post, "/worms")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/worms/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/worms/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/worms/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/worms/:id")
    public delete(@routeParameter("id") id: string) {
    }
}