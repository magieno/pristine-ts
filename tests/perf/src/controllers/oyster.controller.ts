import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class OysterController {
    constructor() {
    }

    @route(HttpMethod.Get, "/oysters")
    public list() {
    }

    @route(HttpMethod.Post, "/oysters")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/oysters/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/oysters/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/oysters/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/oysters/:id")
    public delete(@routeParameter("id") id: string) {
    }
}