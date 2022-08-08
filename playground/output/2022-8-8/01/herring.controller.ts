import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class HerringController {
    constructor() {
    }

    @route(HttpMethod.Get, "/herrings")
    public list() {
    }

    @route(HttpMethod.Post, "/herrings")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/herrings/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/herrings/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/herrings/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/herrings/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
