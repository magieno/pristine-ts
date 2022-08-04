import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class PorpoiseController {
    constructor() {
    }

    @route(HttpMethod.Get, "/porpoises")
    public list() {
    }

    @route(HttpMethod.Post, "/porpoises")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/porpoises/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/porpoises/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/porpoises/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/porpoises/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
