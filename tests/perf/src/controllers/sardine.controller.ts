import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class SardineController {
    constructor() {
    }

    @route(HttpMethod.Get, "/sardines")
    public list() {
    }

    @route(HttpMethod.Post, "/sardines")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/sardines/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/sardines/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/sardines/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/sardines/:id")
    public delete(@routeParameter("id") id: string) {
    }
}