import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class TigerController {
    constructor() {
    }

    @route(HttpMethod.Get, "/tigers")
    public list() {
    }

    @route(HttpMethod.Post, "/tigers")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/tigers/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/tigers/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/tigers/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/tigers/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
