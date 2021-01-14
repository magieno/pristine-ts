import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class MandrillController {
    constructor() {
    }

    @route(HttpMethod.Get, "/mandrills")
    public list() {
    }

    @route(HttpMethod.Post, "/mandrills")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/mandrills/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/mandrills/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/mandrills/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/mandrills/:id")
    public delete(@routeParameter("id") id: string) {
    }
}