import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class DunlinController {
    constructor() {
    }

    @route(HttpMethod.Get, "/dunlins")
    public list() {
    }

    @route(HttpMethod.Post, "/dunlins")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/dunlins/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/dunlins/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/dunlins/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/dunlins/:id")
    public delete(@routeParameter("id") id: string) {
    }
}