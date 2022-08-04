import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class LarkController {
    constructor() {
    }

    @route(HttpMethod.Get, "/larks")
    public list() {
    }

    @route(HttpMethod.Post, "/larks")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/larks/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/larks/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/larks/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/larks/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
