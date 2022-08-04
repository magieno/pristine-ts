import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class OctopusController {
    constructor() {
    }

    @route(HttpMethod.Get, "/octopuss")
    public list() {
    }

    @route(HttpMethod.Post, "/octopuss")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/octopuss/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/octopuss/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/octopuss/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/octopuss/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
