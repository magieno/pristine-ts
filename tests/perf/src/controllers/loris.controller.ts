import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class LorisController {
    constructor() {
    }

    @route(HttpMethod.Get, "/loriss")
    public list() {
    }

    @route(HttpMethod.Post, "/loriss")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/loriss/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/loriss/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/loriss/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/loriss/:id")
    public delete(@routeParameter("id") id: string) {
    }
}