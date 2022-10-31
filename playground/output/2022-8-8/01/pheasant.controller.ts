import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class PheasantController {
    constructor() {
    }

    @route(HttpMethod.Get, "/pheasants")
    public list() {
    }

    @route(HttpMethod.Post, "/pheasants")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/pheasants/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/pheasants/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/pheasants/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/pheasants/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
