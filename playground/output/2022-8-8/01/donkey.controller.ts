import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class DonkeyController {
    constructor() {
    }

    @route(HttpMethod.Get, "/donkeys")
    public list() {
    }

    @route(HttpMethod.Post, "/donkeys")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/donkeys/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/donkeys/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/donkeys/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/donkeys/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
