import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class TurkeyController {
    constructor() {
    }

    @route(HttpMethod.Get, "/turkeys")
    public list() {
    }

    @route(HttpMethod.Post, "/turkeys")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/turkeys/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/turkeys/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/turkeys/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/turkeys/:id")
    public delete(@routeParameter("id") id: string) {
    }
}