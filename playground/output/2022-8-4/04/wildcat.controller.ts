import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class WildcatController {
    constructor() {
    }

    @route(HttpMethod.Get, "/wildcats")
    public list() {
    }

    @route(HttpMethod.Post, "/wildcats")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/wildcats/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/wildcats/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/wildcats/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/wildcats/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
