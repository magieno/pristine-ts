import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class RaccoonController {
    constructor() {
    }

    @route(HttpMethod.Get, "/raccoons")
    public list() {
    }

    @route(HttpMethod.Post, "/raccoons")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/raccoons/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/raccoons/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/raccoons/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/raccoons/:id")
    public delete(@routeParameter("id") id: string) {
    }
}