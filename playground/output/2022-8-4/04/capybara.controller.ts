import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class CapybaraController {
    constructor() {
    }

    @route(HttpMethod.Get, "/capybaras")
    public list() {
    }

    @route(HttpMethod.Post, "/capybaras")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/capybaras/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/capybaras/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/capybaras/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/capybaras/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
