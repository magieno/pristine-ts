import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class GoldfinchController {
    constructor() {
    }

    @route(HttpMethod.Get, "/goldfinchs")
    public list() {
    }

    @route(HttpMethod.Post, "/goldfinchs")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/goldfinchs/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/goldfinchs/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/goldfinchs/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/goldfinchs/:id")
    public delete(@routeParameter("id") id: string) {
    }
}