import {RequestInterface} from "./request.interface";

export interface GuardInterface {
    keyname: string;
    isAuthorized(request: RequestInterface): Promise<boolean>;
}