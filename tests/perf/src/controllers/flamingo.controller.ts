import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class FlamingoController {
    constructor() {
    }

    @route(HttpMethod.Get, "/flamingos")
    public list() {
    }

    @route(HttpMethod.Post, "/flamingos")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/flamingos/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/flamingos/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/flamingos/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/flamingos/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
