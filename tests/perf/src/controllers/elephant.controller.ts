import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class ElephantController {
    constructor() {
    }

    @route(HttpMethod.Get, "/elephants")
    public list() {
    }

    @route(HttpMethod.Post, "/elephants")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/elephants/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/elephants/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/elephants/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/elephants/:id")
    public delete(@routeParameter("id") id: string) {
    }
}