import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class ZebraController {
    constructor() {
    }

    @route(HttpMethod.Get, "/zebras")
    public list() {
    }

    @route(HttpMethod.Post, "/zebras")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/zebras/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/zebras/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/zebras/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/zebras/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
