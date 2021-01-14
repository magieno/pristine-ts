import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class DolphinController {
    constructor() {
    }

    @route(HttpMethod.Get, "/dolphins")
    public list() {
    }

    @route(HttpMethod.Post, "/dolphins")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/dolphins/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/dolphins/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/dolphins/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/dolphins/:id")
    public delete(@routeParameter("id") id: string) {
    }
}