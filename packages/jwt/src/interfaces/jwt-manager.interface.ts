import {RequestInterface} from "@pristine-ts/networking";

export interface JwtManagerInterface {
    validateAndDecode(request: RequestInterface): Promise<any>;
}