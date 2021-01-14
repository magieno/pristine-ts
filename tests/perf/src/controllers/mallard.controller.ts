import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class MallardController {
    constructor() {
    }

    @route(HttpMethod.Get, "/mallards")
    public list() {
    }

    @route(HttpMethod.Post, "/mallards")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/mallards/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/mallards/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/mallards/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/mallards/:id")
    public delete(@routeParameter("id") id: string) {
    }
}