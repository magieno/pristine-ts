import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class GerbilController {
    constructor() {
    }

    @route(HttpMethod.Get, "/gerbils")
    public list() {
    }

    @route(HttpMethod.Post, "/gerbils")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/gerbils/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/gerbils/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/gerbils/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/gerbils/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
