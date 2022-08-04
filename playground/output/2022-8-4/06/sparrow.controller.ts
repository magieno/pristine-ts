import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class SparrowController {
    constructor() {
    }

    @route(HttpMethod.Get, "/sparrows")
    public list() {
    }

    @route(HttpMethod.Post, "/sparrows")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/sparrows/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/sparrows/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/sparrows/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/sparrows/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
