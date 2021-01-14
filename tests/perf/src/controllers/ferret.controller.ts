import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class FerretController {
    constructor() {
    }

    @route(HttpMethod.Get, "/ferrets")
    public list() {
    }

    @route(HttpMethod.Post, "/ferrets")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/ferrets/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/ferrets/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/ferrets/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/ferrets/:id")
    public delete(@routeParameter("id") id: string) {
    }
}