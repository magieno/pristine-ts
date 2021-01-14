import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class ParrotController {
    constructor() {
    }

    @route(HttpMethod.Get, "/parrots")
    public list() {
    }

    @route(HttpMethod.Post, "/parrots")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/parrots/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/parrots/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/parrots/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/parrots/:id")
    public delete(@routeParameter("id") id: string) {
    }
}