import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class CobraController {
    constructor() {
    }

    @route(HttpMethod.Get, "/cobras")
    public list() {
    }

    @route(HttpMethod.Post, "/cobras")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/cobras/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/cobras/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/cobras/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/cobras/:id")
    public delete(@routeParameter("id") id: string) {
    }
}