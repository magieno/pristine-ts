import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class ToadController {
    constructor() {
    }

    @route(HttpMethod.Get, "/toads")
    public list() {
    }

    @route(HttpMethod.Post, "/toads")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/toads/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/toads/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/toads/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/toads/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
