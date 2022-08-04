import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class LionController {
    constructor() {
    }

    @route(HttpMethod.Get, "/lions")
    public list() {
    }

    @route(HttpMethod.Post, "/lions")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/lions/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/lions/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/lions/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/lions/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
