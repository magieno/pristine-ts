import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class SnakeController {
    constructor() {
    }

    @route(HttpMethod.Get, "/snakes")
    public list() {
    }

    @route(HttpMethod.Post, "/snakes")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/snakes/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/snakes/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/snakes/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/snakes/:id")
    public delete(@routeParameter("id") id: string) {
    }
}