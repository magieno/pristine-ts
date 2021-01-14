import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class MooseController {
    constructor() {
    }

    @route(HttpMethod.Get, "/mooses")
    public list() {
    }

    @route(HttpMethod.Post, "/mooses")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/mooses/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/mooses/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/mooses/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/mooses/:id")
    public delete(@routeParameter("id") id: string) {
    }
}