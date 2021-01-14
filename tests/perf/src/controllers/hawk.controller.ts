import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class HawkController {
    constructor() {
    }

    @route(HttpMethod.Get, "/hawks")
    public list() {
    }

    @route(HttpMethod.Post, "/hawks")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/hawks/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/hawks/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/hawks/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/hawks/:id")
    public delete(@routeParameter("id") id: string) {
    }
}