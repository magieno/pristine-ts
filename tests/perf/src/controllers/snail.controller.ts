import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class SnailController {
    constructor() {
    }

    @route(HttpMethod.Get, "/snails")
    public list() {
    }

    @route(HttpMethod.Post, "/snails")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/snails/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/snails/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/snails/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/snails/:id")
    public delete(@routeParameter("id") id: string) {
    }
}