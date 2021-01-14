import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class SandpiperController {
    constructor() {
    }

    @route(HttpMethod.Get, "/sandpipers")
    public list() {
    }

    @route(HttpMethod.Post, "/sandpipers")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/sandpipers/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/sandpipers/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/sandpipers/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/sandpipers/:id")
    public delete(@routeParameter("id") id: string) {
    }
}