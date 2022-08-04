import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class AardvarkController {
    constructor() {
    }

    @route(HttpMethod.Get, "/aardvarks")
    public list() {
    }

    @route(HttpMethod.Post, "/aardvarks")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/aardvarks/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/aardvarks/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/aardvarks/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/aardvarks/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
