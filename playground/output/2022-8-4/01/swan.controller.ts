import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class SwanController {
    constructor() {
    }

    @route(HttpMethod.Get, "/swans")
    public list() {
    }

    @route(HttpMethod.Post, "/swans")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/swans/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/swans/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/swans/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/swans/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
