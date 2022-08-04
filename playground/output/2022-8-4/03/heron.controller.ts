import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class HeronController {
    constructor() {
    }

    @route(HttpMethod.Get, "/herons")
    public list() {
    }

    @route(HttpMethod.Post, "/herons")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/herons/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/herons/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/herons/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/herons/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
