import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class NewtController {
    constructor() {
    }

    @route(HttpMethod.Get, "/newts")
    public list() {
    }

    @route(HttpMethod.Post, "/newts")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/newts/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/newts/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/newts/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/newts/:id")
    public delete(@routeParameter("id") id: string) {
    }
}