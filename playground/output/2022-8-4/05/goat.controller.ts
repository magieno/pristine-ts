import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class GoatController {
    constructor() {
    }

    @route(HttpMethod.Get, "/goats")
    public list() {
    }

    @route(HttpMethod.Post, "/goats")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/goats/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/goats/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/goats/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/goats/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
