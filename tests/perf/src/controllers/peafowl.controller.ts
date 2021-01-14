import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class PeafowlController {
    constructor() {
    }

    @route(HttpMethod.Get, "/peafowls")
    public list() {
    }

    @route(HttpMethod.Post, "/peafowls")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/peafowls/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/peafowls/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/peafowls/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/peafowls/:id")
    public delete(@routeParameter("id") id: string) {
    }
}