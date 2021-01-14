import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class DeerController {
    constructor() {
    }

    @route(HttpMethod.Get, "/deers")
    public list() {
    }

    @route(HttpMethod.Post, "/deers")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/deers/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/deers/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/deers/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/deers/:id")
    public delete(@routeParameter("id") id: string) {
    }
}