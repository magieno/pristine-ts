import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class ChickenController {
    constructor() {
    }

    @route(HttpMethod.Get, "/chickens")
    public list() {
    }

    @route(HttpMethod.Post, "/chickens")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/chickens/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/chickens/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/chickens/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/chickens/:id")
    public delete(@routeParameter("id") id: string) {
    }
}