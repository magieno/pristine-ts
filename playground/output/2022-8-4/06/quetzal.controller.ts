import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class QuetzalController {
    constructor() {
    }

    @route(HttpMethod.Get, "/quetzals")
    public list() {
    }

    @route(HttpMethod.Post, "/quetzals")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/quetzals/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/quetzals/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/quetzals/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/quetzals/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
