import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class CrowController {
    constructor() {
    }

    @route(HttpMethod.Get, "/crows")
    public list() {
    }

    @route(HttpMethod.Post, "/crows")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/crows/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/crows/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/crows/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/crows/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
