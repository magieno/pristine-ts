import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class VultureController {
    constructor() {
    }

    @route(HttpMethod.Get, "/vultures")
    public list() {
    }

    @route(HttpMethod.Post, "/vultures")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/vultures/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/vultures/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/vultures/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/vultures/:id")
    public delete(@routeParameter("id") id: string) {
    }
}