import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class MartenController {
    constructor() {
    }

    @route(HttpMethod.Get, "/martens")
    public list() {
    }

    @route(HttpMethod.Post, "/martens")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/martens/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/martens/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/martens/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/martens/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
