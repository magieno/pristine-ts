import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class KuduController {
    constructor() {
    }

    @route(HttpMethod.Get, "/kudus")
    public list() {
    }

    @route(HttpMethod.Post, "/kudus")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/kudus/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/kudus/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/kudus/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/kudus/:id")
    public delete(@routeParameter("id") id: string) {
    }
}