import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class ChoughController {
    constructor() {
    }

    @route(HttpMethod.Get, "/choughs")
    public list() {
    }

    @route(HttpMethod.Post, "/choughs")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/choughs/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/choughs/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/choughs/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/choughs/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
