import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class GrouseController {
    constructor() {
    }

    @route(HttpMethod.Get, "/grouses")
    public list() {
    }

    @route(HttpMethod.Post, "/grouses")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/grouses/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/grouses/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/grouses/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/grouses/:id")
    public delete(@routeParameter("id") id: string) {
    }
}