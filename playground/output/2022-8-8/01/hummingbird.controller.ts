import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class HummingbirdController {
    constructor() {
    }

    @route(HttpMethod.Get, "/hummingbirds")
    public list() {
    }

    @route(HttpMethod.Post, "/hummingbirds")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/hummingbirds/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/hummingbirds/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/hummingbirds/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/hummingbirds/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
