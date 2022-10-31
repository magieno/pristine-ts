import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class AntelopeController {
    constructor() {
    }

    @route(HttpMethod.Get, "/antelopes")
    public list() {
    }

    @route(HttpMethod.Post, "/antelopes")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/antelopes/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/antelopes/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/antelopes/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/antelopes/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
