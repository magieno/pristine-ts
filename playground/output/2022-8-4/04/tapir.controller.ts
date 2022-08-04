import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class TapirController {
    constructor() {
    }

    @route(HttpMethod.Get, "/tapirs")
    public list() {
    }

    @route(HttpMethod.Post, "/tapirs")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/tapirs/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/tapirs/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/tapirs/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/tapirs/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
