import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class HippopotamusController {
    constructor() {
    }

    @route(HttpMethod.Get, "/hippopotamuss")
    public list() {
    }

    @route(HttpMethod.Post, "/hippopotamuss")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/hippopotamuss/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/hippopotamuss/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/hippopotamuss/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/hippopotamuss/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
