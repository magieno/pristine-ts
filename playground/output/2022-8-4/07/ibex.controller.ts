import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class IbexController {
    constructor() {
    }

    @route(HttpMethod.Get, "/ibexs")
    public list() {
    }

    @route(HttpMethod.Post, "/ibexs")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/ibexs/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/ibexs/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/ibexs/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/ibexs/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
