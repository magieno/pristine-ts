import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class CrabController {
    constructor() {
    }

    @route(HttpMethod.Get, "/crabs")
    public list() {
    }

    @route(HttpMethod.Post, "/crabs")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/crabs/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/crabs/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/crabs/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/crabs/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
