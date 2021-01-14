import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class KingfisherController {
    constructor() {
    }

    @route(HttpMethod.Get, "/kingfishers")
    public list() {
    }

    @route(HttpMethod.Post, "/kingfishers")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/kingfishers/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/kingfishers/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/kingfishers/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/kingfishers/:id")
    public delete(@routeParameter("id") id: string) {
    }
}