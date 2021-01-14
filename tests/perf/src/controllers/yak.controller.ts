import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class YakController {
    constructor() {
    }

    @route(HttpMethod.Get, "/yaks")
    public list() {
    }

    @route(HttpMethod.Post, "/yaks")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/yaks/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/yaks/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/yaks/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/yaks/:id")
    public delete(@routeParameter("id") id: string) {
    }
}