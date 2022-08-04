import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class BatController {
    constructor() {
    }

    @route(HttpMethod.Get, "/bats")
    public list() {
    }

    @route(HttpMethod.Post, "/bats")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/bats/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/bats/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/bats/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/bats/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
