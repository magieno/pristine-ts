import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class ViperController {
    constructor() {
    }

    @route(HttpMethod.Get, "/vipers")
    public list() {
    }

    @route(HttpMethod.Post, "/vipers")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/vipers/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/vipers/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/vipers/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/vipers/:id")
    public delete(@routeParameter("id") id: string) {
    }
}