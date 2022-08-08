import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class RamController {
    constructor() {
    }

    @route(HttpMethod.Get, "/rams")
    public list() {
    }

    @route(HttpMethod.Post, "/rams")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/rams/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/rams/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/rams/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/rams/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
