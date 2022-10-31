import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class HareController {
    constructor() {
    }

    @route(HttpMethod.Get, "/hares")
    public list() {
    }

    @route(HttpMethod.Post, "/hares")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/hares/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/hares/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/hares/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/hares/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
