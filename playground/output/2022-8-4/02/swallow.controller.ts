import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class SwallowController {
    constructor() {
    }

    @route(HttpMethod.Get, "/swallows")
    public list() {
    }

    @route(HttpMethod.Post, "/swallows")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/swallows/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/swallows/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/swallows/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/swallows/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
