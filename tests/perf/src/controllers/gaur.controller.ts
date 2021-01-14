import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class GaurController {
    constructor() {
    }

    @route(HttpMethod.Get, "/gaurs")
    public list() {
    }

    @route(HttpMethod.Post, "/gaurs")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/gaurs/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/gaurs/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/gaurs/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/gaurs/:id")
    public delete(@routeParameter("id") id: string) {
    }
}