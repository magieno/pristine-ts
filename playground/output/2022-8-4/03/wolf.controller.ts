import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class WolfController {
    constructor() {
    }

    @route(HttpMethod.Get, "/wolfs")
    public list() {
    }

    @route(HttpMethod.Post, "/wolfs")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/wolfs/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/wolfs/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/wolfs/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/wolfs/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
