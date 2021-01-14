import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class LocustController {
    constructor() {
    }

    @route(HttpMethod.Get, "/locusts")
    public list() {
    }

    @route(HttpMethod.Post, "/locusts")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/locusts/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/locusts/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/locusts/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/locusts/:id")
    public delete(@routeParameter("id") id: string) {
    }
}