import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class SkunkController {
    constructor() {
    }

    @route(HttpMethod.Get, "/skunks")
    public list() {
    }

    @route(HttpMethod.Post, "/skunks")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/skunks/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/skunks/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/skunks/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/skunks/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
