import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class BearController {
    constructor() {
    }

    @route(HttpMethod.Get, "/bears")
    public list() {
    }

    @route(HttpMethod.Post, "/bears")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/bears/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/bears/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/bears/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/bears/:id")
    public delete(@routeParameter("id") id: string) {
    }
}