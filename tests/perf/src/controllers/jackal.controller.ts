import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class JackalController {
    constructor() {
    }

    @route(HttpMethod.Get, "/jackals")
    public list() {
    }

    @route(HttpMethod.Post, "/jackals")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/jackals/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/jackals/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/jackals/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/jackals/:id")
    public delete(@routeParameter("id") id: string) {
    }
}