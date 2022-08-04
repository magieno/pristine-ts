import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class DuckController {
    constructor() {
    }

    @route(HttpMethod.Get, "/ducks")
    public list() {
    }

    @route(HttpMethod.Post, "/ducks")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/ducks/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/ducks/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/ducks/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/ducks/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
