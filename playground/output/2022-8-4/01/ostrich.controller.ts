import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class OstrichController {
    constructor() {
    }

    @route(HttpMethod.Get, "/ostrichs")
    public list() {
    }

    @route(HttpMethod.Post, "/ostrichs")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/ostrichs/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/ostrichs/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/ostrichs/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/ostrichs/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
