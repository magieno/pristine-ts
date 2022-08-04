import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class BoarController {
    constructor() {
    }

    @route(HttpMethod.Get, "/boars")
    public list() {
    }

    @route(HttpMethod.Post, "/boars")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/boars/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/boars/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/boars/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/boars/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
