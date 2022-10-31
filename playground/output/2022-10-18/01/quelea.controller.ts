import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class QueleaController {
    constructor() {
    }

    @route(HttpMethod.Get, "/queleas")
    public list() {
    }

    @route(HttpMethod.Post, "/queleas")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/queleas/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/queleas/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/queleas/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/queleas/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
