import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class HamsterController {
    constructor() {
    }

    @route(HttpMethod.Get, "/hamsters")
    public list() {
    }

    @route(HttpMethod.Post, "/hamsters")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/hamsters/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/hamsters/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/hamsters/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/hamsters/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
