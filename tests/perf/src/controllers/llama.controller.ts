import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class LlamaController {
    constructor() {
    }

    @route(HttpMethod.Get, "/llamas")
    public list() {
    }

    @route(HttpMethod.Post, "/llamas")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/llamas/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/llamas/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/llamas/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/llamas/:id")
    public delete(@routeParameter("id") id: string) {
    }
}