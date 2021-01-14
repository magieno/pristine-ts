import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class PigController {
    constructor() {
    }

    @route(HttpMethod.Get, "/pigs")
    public list() {
    }

    @route(HttpMethod.Post, "/pigs")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/pigs/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/pigs/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/pigs/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/pigs/:id")
    public delete(@routeParameter("id") id: string) {
    }
}