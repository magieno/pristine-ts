import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class DogController {
    constructor() {
    }

    @route(HttpMethod.Get, "/dogs")
    public list() {
    }

    @route(HttpMethod.Post, "/dogs")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/dogs/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/dogs/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/dogs/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/dogs/:id")
    public delete(@routeParameter("id") id: string) {
    }
}