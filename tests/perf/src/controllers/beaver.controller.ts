import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class BeaverController {
    constructor() {
    }

    @route(HttpMethod.Get, "/beavers")
    public list() {
    }

    @route(HttpMethod.Post, "/beavers")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/beavers/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/beavers/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/beavers/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/beavers/:id")
    public delete(@routeParameter("id") id: string) {
    }
}