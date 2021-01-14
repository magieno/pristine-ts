import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class EelController {
    constructor() {
    }

    @route(HttpMethod.Get, "/eels")
    public list() {
    }

    @route(HttpMethod.Post, "/eels")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/eels/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/eels/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/eels/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/eels/:id")
    public delete(@routeParameter("id") id: string) {
    }
}