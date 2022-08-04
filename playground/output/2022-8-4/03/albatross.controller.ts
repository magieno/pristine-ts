import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class AlbatrossController {
    constructor() {
    }

    @route(HttpMethod.Get, "/albatrosss")
    public list() {
    }

    @route(HttpMethod.Post, "/albatrosss")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/albatrosss/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/albatrosss/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/albatrosss/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/albatrosss/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
