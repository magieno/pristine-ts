import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class MouseController {
    constructor() {
    }

    @route(HttpMethod.Get, "/mouses")
    public list() {
    }

    @route(HttpMethod.Post, "/mouses")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/mouses/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/mouses/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/mouses/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/mouses/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
