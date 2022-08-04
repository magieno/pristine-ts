import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class RabbitController {
    constructor() {
    }

    @route(HttpMethod.Get, "/rabbits")
    public list() {
    }

    @route(HttpMethod.Post, "/rabbits")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/rabbits/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/rabbits/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/rabbits/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/rabbits/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
