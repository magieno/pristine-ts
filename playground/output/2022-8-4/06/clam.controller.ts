import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class ClamController {
    constructor() {
    }

    @route(HttpMethod.Get, "/clams")
    public list() {
    }

    @route(HttpMethod.Post, "/clams")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/clams/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/clams/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/clams/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/clams/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
