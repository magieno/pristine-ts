import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class BuffaloController {
    constructor() {
    }

    @route(HttpMethod.Get, "/buffalos")
    public list() {
    }

    @route(HttpMethod.Post, "/buffalos")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/buffalos/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/buffalos/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/buffalos/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/buffalos/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
