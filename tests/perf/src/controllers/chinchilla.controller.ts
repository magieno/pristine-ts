import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class ChinchillaController {
    constructor() {
    }

    @route(HttpMethod.Get, "/chinchillas")
    public list() {
    }

    @route(HttpMethod.Post, "/chinchillas")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/chinchillas/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/chinchillas/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/chinchillas/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/chinchillas/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
