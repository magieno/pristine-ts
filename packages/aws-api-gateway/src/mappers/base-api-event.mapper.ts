import {HttpMethod} from "@pristine-ts/common";

export class BaseApiEventMapper {

    protected mapHttpMethod(method: string): HttpMethod {
        method = method.toLowerCase();

        switch (method) {
            case "get":
                return HttpMethod.Get;
            case "post":
                return HttpMethod.Post;
            case "put":
                return HttpMethod.Put;
            case "patch":
                return HttpMethod.Patch;
            case "delete":
                return HttpMethod.Delete;
            case "options":
                return HttpMethod.Options;
            default:
                return HttpMethod.Get;
        }
    }
}
