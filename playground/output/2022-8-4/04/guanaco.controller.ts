import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class GuanacoController {
    constructor() {
    }

    @route(HttpMethod.Get, "/guanacos")
    public list() {
    }

    @route(HttpMethod.Post, "/guanacos")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/guanacos/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/guanacos/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/guanacos/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/guanacos/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
