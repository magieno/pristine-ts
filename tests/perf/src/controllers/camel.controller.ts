import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class CamelController {
    constructor() {
    }

    @route(HttpMethod.Get, "/camels")
    public list() {
    }

    @route(HttpMethod.Post, "/camels")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/camels/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/camels/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/camels/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/camels/:id")
    public delete(@routeParameter("id") id: string) {
    }
}