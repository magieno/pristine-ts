import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class QuailController {
    constructor() {
    }

    @route(HttpMethod.Get, "/quails")
    public list() {
    }

    @route(HttpMethod.Post, "/quails")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/quails/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/quails/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/quails/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/quails/:id")
    public delete(@routeParameter("id") id: string) {
    }
}