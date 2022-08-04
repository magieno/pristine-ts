import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class GullController {
    constructor() {
    }

    @route(HttpMethod.Get, "/gulls")
    public list() {
    }

    @route(HttpMethod.Post, "/gulls")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/gulls/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/gulls/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/gulls/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/gulls/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
