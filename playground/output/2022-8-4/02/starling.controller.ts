import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class StarlingController {
    constructor() {
    }

    @route(HttpMethod.Get, "/starlings")
    public list() {
    }

    @route(HttpMethod.Post, "/starlings")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/starlings/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/starlings/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/starlings/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/starlings/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
