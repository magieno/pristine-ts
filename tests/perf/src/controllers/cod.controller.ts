import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class CodController {
    constructor() {
    }

    @route(HttpMethod.Get, "/cods")
    public list() {
    }

    @route(HttpMethod.Post, "/cods")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/cods/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/cods/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/cods/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/cods/:id")
    public delete(@routeParameter("id") id: string) {
    }
}