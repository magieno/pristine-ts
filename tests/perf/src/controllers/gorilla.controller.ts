import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class GorillaController {
    constructor() {
    }

    @route(HttpMethod.Get, "/gorillas")
    public list() {
    }

    @route(HttpMethod.Post, "/gorillas")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/gorillas/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/gorillas/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/gorillas/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/gorillas/:id")
    public delete(@routeParameter("id") id: string) {
    }
}