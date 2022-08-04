import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class Sand DollarController {
    constructor() {
    }

    @route(HttpMethod.Get, "/sand dollars")
    public list() {
    }

    @route(HttpMethod.Post, "/sand dollars")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/sand dollars/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/sand dollars/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/sand dollars/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/sand dollars/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
