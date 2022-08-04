import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class WoodcockController {
    constructor() {
    }

    @route(HttpMethod.Get, "/woodcocks")
    public list() {
    }

    @route(HttpMethod.Post, "/woodcocks")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/woodcocks/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/woodcocks/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/woodcocks/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/woodcocks/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
