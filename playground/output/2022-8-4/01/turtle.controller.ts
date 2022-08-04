import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class TurtleController {
    constructor() {
    }

    @route(HttpMethod.Get, "/turtles")
    public list() {
    }

    @route(HttpMethod.Post, "/turtles")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/turtles/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/turtles/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/turtles/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/turtles/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
