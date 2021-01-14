import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class EmuController {
    constructor() {
    }

    @route(HttpMethod.Get, "/emus")
    public list() {
    }

    @route(HttpMethod.Post, "/emus")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/emus/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/emus/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/emus/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/emus/:id")
    public delete(@routeParameter("id") id: string) {
    }
}