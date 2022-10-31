import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class FlyController {
    constructor() {
    }

    @route(HttpMethod.Get, "/flys")
    public list() {
    }

    @route(HttpMethod.Post, "/flys")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/flys/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/flys/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/flys/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/flys/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
