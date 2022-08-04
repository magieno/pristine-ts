import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class TroutController {
    constructor() {
    }

    @route(HttpMethod.Get, "/trouts")
    public list() {
    }

    @route(HttpMethod.Post, "/trouts")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/trouts/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/trouts/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/trouts/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/trouts/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
