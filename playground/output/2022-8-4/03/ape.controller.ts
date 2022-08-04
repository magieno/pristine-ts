import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class ApeController {
    constructor() {
    }

    @route(HttpMethod.Get, "/apes")
    public list() {
    }

    @route(HttpMethod.Post, "/apes")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/apes/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/apes/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/apes/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/apes/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
