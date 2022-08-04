import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class HumanController {
    constructor() {
    }

    @route(HttpMethod.Get, "/humans")
    public list() {
    }

    @route(HttpMethod.Post, "/humans")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/humans/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/humans/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/humans/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/humans/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
