import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class MoleController {
    constructor() {
    }

    @route(HttpMethod.Get, "/moles")
    public list() {
    }

    @route(HttpMethod.Post, "/moles")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/moles/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/moles/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/moles/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/moles/:id")
    public delete(@routeParameter("id") id: string) {
    }
}