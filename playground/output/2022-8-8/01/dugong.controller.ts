import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class DugongController {
    constructor() {
    }

    @route(HttpMethod.Get, "/dugongs")
    public list() {
    }

    @route(HttpMethod.Post, "/dugongs")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/dugongs/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/dugongs/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/dugongs/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/dugongs/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
