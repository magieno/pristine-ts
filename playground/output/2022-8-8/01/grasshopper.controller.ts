import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class GrasshopperController {
    constructor() {
    }

    @route(HttpMethod.Get, "/grasshoppers")
    public list() {
    }

    @route(HttpMethod.Post, "/grasshoppers")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/grasshoppers/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/grasshoppers/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/grasshoppers/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/grasshoppers/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
