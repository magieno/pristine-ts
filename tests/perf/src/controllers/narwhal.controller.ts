import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class NarwhalController {
    constructor() {
    }

    @route(HttpMethod.Get, "/narwhals")
    public list() {
    }

    @route(HttpMethod.Post, "/narwhals")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/narwhals/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/narwhals/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/narwhals/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/narwhals/:id")
    public delete(@routeParameter("id") id: string) {
    }
}