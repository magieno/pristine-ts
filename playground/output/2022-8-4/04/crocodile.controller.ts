import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class CrocodileController {
    constructor() {
    }

    @route(HttpMethod.Get, "/crocodiles")
    public list() {
    }

    @route(HttpMethod.Post, "/crocodiles")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/crocodiles/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/crocodiles/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/crocodiles/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/crocodiles/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
