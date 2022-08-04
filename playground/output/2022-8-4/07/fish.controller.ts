import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class FishController {
    constructor() {
    }

    @route(HttpMethod.Get, "/fishs")
    public list() {
    }

    @route(HttpMethod.Post, "/fishs")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/fishs/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/fishs/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/fishs/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/fishs/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
