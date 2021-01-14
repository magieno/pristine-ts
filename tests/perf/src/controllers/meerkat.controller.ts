import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class MeerkatController {
    constructor() {
    }

    @route(HttpMethod.Get, "/meerkats")
    public list() {
    }

    @route(HttpMethod.Post, "/meerkats")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/meerkats/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/meerkats/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/meerkats/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/meerkats/:id")
    public delete(@routeParameter("id") id: string) {
    }
}