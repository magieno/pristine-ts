import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class WoodpeckerController {
    constructor() {
    }

    @route(HttpMethod.Get, "/woodpeckers")
    public list() {
    }

    @route(HttpMethod.Post, "/woodpeckers")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/woodpeckers/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/woodpeckers/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/woodpeckers/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/woodpeckers/:id")
    public delete(@routeParameter("id") id: string) {
    }
}