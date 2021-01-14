import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class ElandController {
    constructor() {
    }

    @route(HttpMethod.Get, "/elands")
    public list() {
    }

    @route(HttpMethod.Post, "/elands")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/elands/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/elands/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/elands/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/elands/:id")
    public delete(@routeParameter("id") id: string) {
    }
}