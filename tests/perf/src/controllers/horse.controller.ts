import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class HorseController {
    constructor() {
    }

    @route(HttpMethod.Get, "/horses")
    public list() {
    }

    @route(HttpMethod.Post, "/horses")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/horses/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/horses/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/horses/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/horses/:id")
    public delete(@routeParameter("id") id: string) {
    }
}