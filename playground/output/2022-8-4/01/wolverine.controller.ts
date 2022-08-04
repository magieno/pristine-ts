import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class WolverineController {
    constructor() {
    }

    @route(HttpMethod.Get, "/wolverines")
    public list() {
    }

    @route(HttpMethod.Post, "/wolverines")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/wolverines/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/wolverines/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/wolverines/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/wolverines/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
