import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class ReindeerController {
    constructor() {
    }

    @route(HttpMethod.Get, "/reindeers")
    public list() {
    }

    @route(HttpMethod.Post, "/reindeers")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/reindeers/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/reindeers/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/reindeers/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/reindeers/:id")
    public delete(@routeParameter("id") id: string) {
    }
}