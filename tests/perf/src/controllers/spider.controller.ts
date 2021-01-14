import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class SpiderController {
    constructor() {
    }

    @route(HttpMethod.Get, "/spiders")
    public list() {
    }

    @route(HttpMethod.Post, "/spiders")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/spiders/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/spiders/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/spiders/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/spiders/:id")
    public delete(@routeParameter("id") id: string) {
    }
}