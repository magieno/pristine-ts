import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class FalconController {
    constructor() {
    }

    @route(HttpMethod.Get, "/falcons")
    public list() {
    }

    @route(HttpMethod.Post, "/falcons")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/falcons/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/falcons/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/falcons/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/falcons/:id")
    public delete(@routeParameter("id") id: string) {
    }
}