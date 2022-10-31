import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class PelicanController {
    constructor() {
    }

    @route(HttpMethod.Get, "/pelicans")
    public list() {
    }

    @route(HttpMethod.Post, "/pelicans")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/pelicans/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/pelicans/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/pelicans/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/pelicans/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
