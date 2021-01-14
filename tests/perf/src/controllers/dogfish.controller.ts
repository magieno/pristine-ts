import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class DogfishController {
    constructor() {
    }

    @route(HttpMethod.Get, "/dogfishs")
    public list() {
    }

    @route(HttpMethod.Post, "/dogfishs")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/dogfishs/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/dogfishs/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/dogfishs/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/dogfishs/:id")
    public delete(@routeParameter("id") id: string) {
    }
}