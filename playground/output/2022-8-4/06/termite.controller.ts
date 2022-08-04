import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class TermiteController {
    constructor() {
    }

    @route(HttpMethod.Get, "/termites")
    public list() {
    }

    @route(HttpMethod.Post, "/termites")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/termites/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/termites/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/termites/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/termites/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
