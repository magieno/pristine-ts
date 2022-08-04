import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class GiraffeController {
    constructor() {
    }

    @route(HttpMethod.Get, "/giraffes")
    public list() {
    }

    @route(HttpMethod.Post, "/giraffes")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/giraffes/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/giraffes/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/giraffes/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/giraffes/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
