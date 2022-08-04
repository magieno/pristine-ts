import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class DragonflyController {
    constructor() {
    }

    @route(HttpMethod.Get, "/dragonflys")
    public list() {
    }

    @route(HttpMethod.Post, "/dragonflys")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/dragonflys/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/dragonflys/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/dragonflys/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/dragonflys/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
