import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class AnteaterController {
    constructor() {
    }

    @route(HttpMethod.Get, "/anteaters")
    public list() {
    }

    @route(HttpMethod.Post, "/anteaters")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/anteaters/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/anteaters/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/anteaters/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/anteaters/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
