import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class HyenaController {
    constructor() {
    }

    @route(HttpMethod.Get, "/hyenas")
    public list() {
    }

    @route(HttpMethod.Post, "/hyenas")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/hyenas/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/hyenas/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/hyenas/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/hyenas/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
