import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class SquirrelController {
    constructor() {
    }

    @route(HttpMethod.Get, "/squirrels")
    public list() {
    }

    @route(HttpMethod.Post, "/squirrels")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/squirrels/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/squirrels/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/squirrels/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/squirrels/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
