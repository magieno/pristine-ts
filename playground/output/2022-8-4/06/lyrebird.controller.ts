import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class LyrebirdController {
    constructor() {
    }

    @route(HttpMethod.Get, "/lyrebirds")
    public list() {
    }

    @route(HttpMethod.Post, "/lyrebirds")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/lyrebirds/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/lyrebirds/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/lyrebirds/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/lyrebirds/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
