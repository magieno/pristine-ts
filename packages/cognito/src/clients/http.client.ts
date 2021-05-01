import {injectable, inject} from "tsyringe";
import * as Axios from 'axios';
import {HttpClientInterface} from "../interfaces/http-client.interface";


// todo: move somewhere else Networking Core Common ?
@injectable()
export class HttpClient implements HttpClientInterface{

    constructor(
    ) {
    }

    async get<T>(url: string): Promise<T> {
        return (await Axios.default.get<T>(url)).data;
    }
}
