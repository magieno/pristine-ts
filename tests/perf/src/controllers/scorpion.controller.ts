import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class ScorpionController {
    constructor() {
    }

    @route(HttpMethod.Get, "/scorpions")
    public list() {
    }

    @route(HttpMethod.Post, "/scorpions")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/scorpions/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/scorpions/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/scorpions/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/scorpions/:id")
    public delete(@routeParameter("id") id: string) {
    }
}