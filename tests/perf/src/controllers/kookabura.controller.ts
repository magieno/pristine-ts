import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class KookaburaController {
    constructor() {
    }

    @route(HttpMethod.Get, "/kookaburas")
    public list() {
    }

    @route(HttpMethod.Post, "/kookaburas")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/kookaburas/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/kookaburas/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/kookaburas/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/kookaburas/:id")
    public delete(@routeParameter("id") id: string) {
    }
}