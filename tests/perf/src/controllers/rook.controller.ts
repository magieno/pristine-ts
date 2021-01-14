import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class RookController {
    constructor() {
    }

    @route(HttpMethod.Get, "/rooks")
    public list() {
    }

    @route(HttpMethod.Post, "/rooks")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/rooks/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/rooks/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/rooks/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/rooks/:id")
    public delete(@routeParameter("id") id: string) {
    }
}