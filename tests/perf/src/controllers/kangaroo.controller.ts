import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class KangarooController {
    constructor() {
    }

    @route(HttpMethod.Get, "/kangaroos")
    public list() {
    }

    @route(HttpMethod.Post, "/kangaroos")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/kangaroos/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/kangaroos/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/kangaroos/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/kangaroos/:id")
    public delete(@routeParameter("id") id: string) {
    }
}