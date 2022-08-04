import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class MagpieController {
    constructor() {
    }

    @route(HttpMethod.Get, "/magpies")
    public list() {
    }

    @route(HttpMethod.Post, "/magpies")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/magpies/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/magpies/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/magpies/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/magpies/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
