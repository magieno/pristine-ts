import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class BarracudaController {
    constructor() {
    }

    @route(HttpMethod.Get, "/barracudas")
    public list() {
    }

    @route(HttpMethod.Post, "/barracudas")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/barracudas/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/barracudas/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/barracudas/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/barracudas/:id")
    public delete(@routeParameter("id") id: string) {
    }
}