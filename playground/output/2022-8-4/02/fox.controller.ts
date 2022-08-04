import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class FoxController {
    constructor() {
    }

    @route(HttpMethod.Get, "/foxs")
    public list() {
    }

    @route(HttpMethod.Post, "/foxs")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/foxs/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/foxs/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/foxs/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/foxs/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
