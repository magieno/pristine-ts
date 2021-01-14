import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class DotterelController {
    constructor() {
    }

    @route(HttpMethod.Get, "/dotterels")
    public list() {
    }

    @route(HttpMethod.Post, "/dotterels")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/dotterels/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/dotterels/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/dotterels/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/dotterels/:id")
    public delete(@routeParameter("id") id: string) {
    }
}