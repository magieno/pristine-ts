import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class BadgerController {
    constructor() {
    }

    @route(HttpMethod.Get, "/badgers")
    public list() {
    }

    @route(HttpMethod.Post, "/badgers")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/badgers/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/badgers/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/badgers/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/badgers/:id")
    public delete(@routeParameter("id") id: string) {
    }
}