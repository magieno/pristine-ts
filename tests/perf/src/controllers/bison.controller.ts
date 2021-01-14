import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class BisonController {
    constructor() {
    }

    @route(HttpMethod.Get, "/bisons")
    public list() {
    }

    @route(HttpMethod.Post, "/bisons")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/bisons/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/bisons/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/bisons/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/bisons/:id")
    public delete(@routeParameter("id") id: string) {
    }
}