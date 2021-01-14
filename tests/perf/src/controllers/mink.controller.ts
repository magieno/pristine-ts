import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class MinkController {
    constructor() {
    }

    @route(HttpMethod.Get, "/minks")
    public list() {
    }

    @route(HttpMethod.Post, "/minks")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/minks/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/minks/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/minks/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/minks/:id")
    public delete(@routeParameter("id") id: string) {
    }
}