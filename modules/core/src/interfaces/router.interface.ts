import {HttpMethod} from "../enums/http-method.enum";
import {RouteInformation} from "../network/route-information";
import {RequestInterface} from "./request.interface";
import {DependencyContainer} from "tsyringe";
import {Response} from "../network/response";
import {Request} from "../network/request";

export interface RouterInterface {
    register(path: string, method: HttpMethod | string, route: RouteInformation)

    execute(request: Request, container: DependencyContainer): Promise<Response>
}