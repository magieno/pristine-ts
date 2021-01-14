import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class FrogController {
    constructor() {
    }

    @route(HttpMethod.Get, "/frogs")
    public list() {
    }

    @route(HttpMethod.Post, "/frogs")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/frogs/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/frogs/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/frogs/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/frogs/:id")
    public delete(@routeParameter("id") id: string) {
    }
}