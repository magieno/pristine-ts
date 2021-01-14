import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class SalamanderController {
    constructor() {
    }

    @route(HttpMethod.Get, "/salamanders")
    public list() {
    }

    @route(HttpMethod.Post, "/salamanders")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/salamanders/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/salamanders/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/salamanders/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/salamanders/:id")
    public delete(@routeParameter("id") id: string) {
    }
}