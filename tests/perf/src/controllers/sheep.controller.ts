import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class SheepController {
    constructor() {
    }

    @route(HttpMethod.Get, "/sheeps")
    public list() {
    }

    @route(HttpMethod.Post, "/sheeps")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/sheeps/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/sheeps/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/sheeps/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/sheeps/:id")
    public delete(@routeParameter("id") id: string) {
    }
}