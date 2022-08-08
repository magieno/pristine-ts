import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class CattleController {
    constructor() {
    }

    @route(HttpMethod.Get, "/cattles")
    public list() {
    }

    @route(HttpMethod.Post, "/cattles")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/cattles/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/cattles/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/cattles/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/cattles/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
