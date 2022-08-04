import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class WeaselController {
    constructor() {
    }

    @route(HttpMethod.Get, "/weasels")
    public list() {
    }

    @route(HttpMethod.Post, "/weasels")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/weasels/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/weasels/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/weasels/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/weasels/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
