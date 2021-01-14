import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class CormorantController {
    constructor() {
    }

    @route(HttpMethod.Get, "/cormorants")
    public list() {
    }

    @route(HttpMethod.Post, "/cormorants")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/cormorants/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/cormorants/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/cormorants/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/cormorants/:id")
    public delete(@routeParameter("id") id: string) {
    }
}