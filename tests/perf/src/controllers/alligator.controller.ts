import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class AlligatorController {
    constructor() {
    }

    @route(HttpMethod.Get, "/alligators")
    public list() {
    }

    @route(HttpMethod.Post, "/alligators")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/alligators/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/alligators/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/alligators/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/alligators/:id")
    public delete(@routeParameter("id") id: string) {
    }
}