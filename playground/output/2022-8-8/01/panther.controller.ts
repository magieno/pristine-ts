import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class PantherController {
    constructor() {
    }

    @route(HttpMethod.Get, "/panthers")
    public list() {
    }

    @route(HttpMethod.Post, "/panthers")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/panthers/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/panthers/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/panthers/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/panthers/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
