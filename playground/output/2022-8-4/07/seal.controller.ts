import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class SealController {
    constructor() {
    }

    @route(HttpMethod.Get, "/seals")
    public list() {
    }

    @route(HttpMethod.Post, "/seals")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/seals/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/seals/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/seals/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/seals/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
