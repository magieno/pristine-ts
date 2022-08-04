import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class OkapiController {
    constructor() {
    }

    @route(HttpMethod.Get, "/okapis")
    public list() {
    }

    @route(HttpMethod.Post, "/okapis")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/okapis/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/okapis/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/okapis/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/okapis/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
