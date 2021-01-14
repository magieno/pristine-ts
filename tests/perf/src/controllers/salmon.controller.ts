import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class SalmonController {
    constructor() {
    }

    @route(HttpMethod.Get, "/salmons")
    public list() {
    }

    @route(HttpMethod.Post, "/salmons")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/salmons/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/salmons/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/salmons/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/salmons/:id")
    public delete(@routeParameter("id") id: string) {
    }
}