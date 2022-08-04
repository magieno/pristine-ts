import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class CockroachController {
    constructor() {
    }

    @route(HttpMethod.Get, "/cockroachs")
    public list() {
    }

    @route(HttpMethod.Post, "/cockroachs")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/cockroachs/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/cockroachs/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/cockroachs/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/cockroachs/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
