import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class PenguinController {
    constructor() {
    }

    @route(HttpMethod.Get, "/penguins")
    public list() {
    }

    @route(HttpMethod.Post, "/penguins")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/penguins/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/penguins/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/penguins/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/penguins/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
