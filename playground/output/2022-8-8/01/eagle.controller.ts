import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class EagleController {
    constructor() {
    }

    @route(HttpMethod.Get, "/eagles")
    public list() {
    }

    @route(HttpMethod.Post, "/eagles")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/eagles/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/eagles/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/eagles/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/eagles/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
