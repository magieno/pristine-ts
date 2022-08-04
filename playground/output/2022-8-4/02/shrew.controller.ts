import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class ShrewController {
    constructor() {
    }

    @route(HttpMethod.Get, "/shrews")
    public list() {
    }

    @route(HttpMethod.Post, "/shrews")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/shrews/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/shrews/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/shrews/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/shrews/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
