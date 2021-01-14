import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class KoalaController {
    constructor() {
    }

    @route(HttpMethod.Get, "/koalas")
    public list() {
    }

    @route(HttpMethod.Post, "/koalas")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/koalas/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/koalas/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/koalas/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/koalas/:id")
    public delete(@routeParameter("id") id: string) {
    }
}