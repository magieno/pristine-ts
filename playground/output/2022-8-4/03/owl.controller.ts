import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class OwlController {
    constructor() {
    }

    @route(HttpMethod.Get, "/owls")
    public list() {
    }

    @route(HttpMethod.Post, "/owls")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/owls/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/owls/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/owls/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/owls/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
