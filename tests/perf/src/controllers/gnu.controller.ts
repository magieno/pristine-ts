import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class GnuController {
    constructor() {
    }

    @route(HttpMethod.Get, "/gnus")
    public list() {
    }

    @route(HttpMethod.Post, "/gnus")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/gnus/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/gnus/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/gnus/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/gnus/:id")
    public delete(@routeParameter("id") id: string) {
    }
}