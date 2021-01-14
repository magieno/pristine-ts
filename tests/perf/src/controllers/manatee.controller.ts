import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class ManateeController {
    constructor() {
    }

    @route(HttpMethod.Get, "/manatees")
    public list() {
    }

    @route(HttpMethod.Post, "/manatees")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/manatees/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/manatees/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/manatees/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/manatees/:id")
    public delete(@routeParameter("id") id: string) {
    }
}