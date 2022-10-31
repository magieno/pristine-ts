import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class MuleController {
    constructor() {
    }

    @route(HttpMethod.Get, "/mules")
    public list() {
    }

    @route(HttpMethod.Post, "/mules")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/mules/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/mules/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/mules/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/mules/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
