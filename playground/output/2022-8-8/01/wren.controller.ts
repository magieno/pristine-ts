import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class WrenController {
    constructor() {
    }

    @route(HttpMethod.Get, "/wrens")
    public list() {
    }

    @route(HttpMethod.Post, "/wrens")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/wrens/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/wrens/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/wrens/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/wrens/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
