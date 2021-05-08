import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class ButterflyController {
    constructor() {
    }

    @route(HttpMethod.Get, "/butterflys")
    public list() {
    }

    @route(HttpMethod.Post, "/butterflys")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/butterflys/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/butterflys/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/butterflys/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/butterflys/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
