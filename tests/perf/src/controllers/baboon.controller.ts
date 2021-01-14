import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class BaboonController {
    constructor() {
    }

    @route(HttpMethod.Get, "/baboons")
    public list() {
    }

    @route(HttpMethod.Post, "/baboons")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/baboons/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/baboons/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/baboons/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/baboons/:id")
    public delete(@routeParameter("id") id: string) {
    }
}