import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class HedgehogController {
    constructor() {
    }

    @route(HttpMethod.Get, "/hedgehogs")
    public list() {
    }

    @route(HttpMethod.Post, "/hedgehogs")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/hedgehogs/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/hedgehogs/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/hedgehogs/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/hedgehogs/:id")
    public delete(@routeParameter("id") id: string) {
    }
}