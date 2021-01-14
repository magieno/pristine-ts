import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class JellyfishController {
    constructor() {
    }

    @route(HttpMethod.Get, "/jellyfishs")
    public list() {
    }

    @route(HttpMethod.Post, "/jellyfishs")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/jellyfishs/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/jellyfishs/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/jellyfishs/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/jellyfishs/:id")
    public delete(@routeParameter("id") id: string) {
    }
}