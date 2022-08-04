import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class OtterController {
    constructor() {
    }

    @route(HttpMethod.Get, "/otters")
    public list() {
    }

    @route(HttpMethod.Post, "/otters")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/otters/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/otters/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/otters/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/otters/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
