import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class GooseController {
    constructor() {
    }

    @route(HttpMethod.Get, "/gooses")
    public list() {
    }

    @route(HttpMethod.Post, "/gooses")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/gooses/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/gooses/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/gooses/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/gooses/:id")
    public delete(@routeParameter("id") id: string) {
    }
}