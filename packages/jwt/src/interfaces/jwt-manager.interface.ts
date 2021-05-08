import {RequestInterface} from "@pristine-ts/common";

export interface JwtManagerInterface {
    validateAndDecode(request: RequestInterface): Promise<any>;
}