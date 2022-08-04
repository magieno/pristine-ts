import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

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
