import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class LapwingController {
    constructor() {
    }

    @route(HttpMethod.Get, "/lapwings")
    public list() {
    }

    @route(HttpMethod.Post, "/lapwings")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/lapwings/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/lapwings/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/lapwings/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/lapwings/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
