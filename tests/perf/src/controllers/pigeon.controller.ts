import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class PigeonController {
    constructor() {
    }

    @route(HttpMethod.Get, "/pigeons")
    public list() {
    }

    @route(HttpMethod.Post, "/pigeons")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/pigeons/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/pigeons/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/pigeons/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/pigeons/:id")
    public delete(@routeParameter("id") id: string) {
    }
}