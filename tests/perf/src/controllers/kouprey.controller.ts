import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class KoupreyController {
    constructor() {
    }

    @route(HttpMethod.Get, "/koupreys")
    public list() {
    }

    @route(HttpMethod.Post, "/koupreys")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/koupreys/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/koupreys/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/koupreys/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/koupreys/:id")
    public delete(@routeParameter("id") id: string) {
    }
}