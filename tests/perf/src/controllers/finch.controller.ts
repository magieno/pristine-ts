import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class FinchController {
    constructor() {
    }

    @route(HttpMethod.Get, "/finchs")
    public list() {
    }

    @route(HttpMethod.Post, "/finchs")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/finchs/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/finchs/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/finchs/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/finchs/:id")
    public delete(@routeParameter("id") id: string) {
    }
}