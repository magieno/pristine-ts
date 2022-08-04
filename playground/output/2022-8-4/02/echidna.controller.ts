import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class EchidnaController {
    constructor() {
    }

    @route(HttpMethod.Get, "/echidnas")
    public list() {
    }

    @route(HttpMethod.Post, "/echidnas")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/echidnas/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/echidnas/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/echidnas/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/echidnas/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
