import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class JayController {
    constructor() {
    }

    @route(HttpMethod.Get, "/jays")
    public list() {
    }

    @route(HttpMethod.Post, "/jays")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/jays/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/jays/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/jays/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/jays/:id")
    public delete(@routeParameter("id") id: string) {
    }
}