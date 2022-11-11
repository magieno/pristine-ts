import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class CaterpillarController {
    constructor() {
    }

    @route(HttpMethod.Get, "/caterpillars")
    public list() {
    }

    @route(HttpMethod.Post, "/caterpillars")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/caterpillars/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/caterpillars/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/caterpillars/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/caterpillars/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
