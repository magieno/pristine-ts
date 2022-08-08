import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class GoldfishController {
    constructor() {
    }

    @route(HttpMethod.Get, "/goldfishs")
    public list() {
    }

    @route(HttpMethod.Post, "/goldfishs")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/goldfishs/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/goldfishs/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/goldfishs/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/goldfishs/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
