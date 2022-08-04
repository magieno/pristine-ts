import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class Red deerController {
    constructor() {
    }

    @route(HttpMethod.Get, "/red deers")
    public list() {
    }

    @route(HttpMethod.Post, "/red deers")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/red deers/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/red deers/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/red deers/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/red deers/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
