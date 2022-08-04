import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class Red pandaController {
    constructor() {
    }

    @route(HttpMethod.Get, "/red pandas")
    public list() {
    }

    @route(HttpMethod.Post, "/red pandas")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/red pandas/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/red pandas/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/red pandas/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/red pandas/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
