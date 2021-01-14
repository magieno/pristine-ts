import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class MosquitoController {
    constructor() {
    }

    @route(HttpMethod.Get, "/mosquitos")
    public list() {
    }

    @route(HttpMethod.Post, "/mosquitos")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/mosquitos/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/mosquitos/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/mosquitos/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/mosquitos/:id")
    public delete(@routeParameter("id") id: string) {
    }
}