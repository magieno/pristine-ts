import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class __TOKEN_CAPITALIZED__Controller {
    constructor() {
    }

    @route(HttpMethod.Get, "/__TOKEN_PLURAL__")
    public list() {
    }

    @route(HttpMethod.Post, "/__TOKEN_PLURAL__")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/__TOKEN_PLURAL__/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/__TOKEN_PLURAL__/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/__TOKEN_PLURAL__/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/__TOKEN_PLURAL__/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
