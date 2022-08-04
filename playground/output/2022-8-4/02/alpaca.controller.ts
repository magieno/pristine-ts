import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class AlpacaController {
    constructor() {
    }

    @route(HttpMethod.Get, "/alpacas")
    public list() {
    }

    @route(HttpMethod.Post, "/alpacas")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/alpacas/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/alpacas/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/alpacas/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/alpacas/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
