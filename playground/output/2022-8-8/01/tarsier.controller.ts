import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class TarsierController {
    constructor() {
    }

    @route(HttpMethod.Get, "/tarsiers")
    public list() {
    }

    @route(HttpMethod.Post, "/tarsiers")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/tarsiers/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/tarsiers/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/tarsiers/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/tarsiers/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
