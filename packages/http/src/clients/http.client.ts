import {injectable} from "tsyringe";
import {HttpClientInterface} from "../interfaces/http-client.interface";
import {HttpRequestInterface} from "../interfaces/http-request.interface";
import {HttpResponseInterface} from "../interfaces/http-response.interface";

@injectable()
export class HttpClient implements HttpClientInterface {
    request(request: HttpRequestInterface): Promise<HttpResponseInterface> {
        return Promise.resolve(undefined);
    }

}
