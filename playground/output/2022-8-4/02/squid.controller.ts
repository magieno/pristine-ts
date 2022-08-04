import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class SquidController {
    constructor() {
    }

    @route(HttpMethod.Get, "/squids")
    public list() {
    }

    @route(HttpMethod.Post, "/squids")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/squids/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/squids/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/squids/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/squids/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
