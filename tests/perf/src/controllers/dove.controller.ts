import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class DoveController {
    constructor() {
    }

    @route(HttpMethod.Get, "/doves")
    public list() {
    }

    @route(HttpMethod.Post, "/doves")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/doves/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/doves/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/doves/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/doves/:id")
    public delete(@routeParameter("id") id: string) {
    }
}